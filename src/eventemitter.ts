import { EventEmitter } from 'events';
import { Vector, Hash } from '@polkadot/types';
import { isHex } from '@polkadot/util';
import initApi from './api';
import * as Github from './processors/github';
import * as Twitter from './processors/twitter';

function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

export type EdgewareIdentityEvent = {
  identityType: string,
  identity: string,
  identityHash: Hash,
  attestation: string,
  sender: string,
  error: string | undefined,
}

export type IdentityResponseData = {
  identityType: string,
  identity: string,
  identityHash: Hash,
  sender: string,
  proof: string,
  description: string,
  attestation: string,
  error: string | undefined,
}

export type EventResult = {
  success: boolean,
  data: IdentityResponseData | EdgewareIdentityEvent,
};


/**
 * This is where you hook up your event keys
 */
type EmitterEventKeys = { [key: string]: string }
export const EmitterEventKeys = {
  IDENTITY_EVENT: 'edgeware-identity'
}

const processIdentityEvents = async (remoteNodeUrl: string, events) => {
  let githubEvents: Array<EdgewareIdentityEvent> = [];
  let twitterEvents: Array<EdgewareIdentityEvent> = [];
  events.forEach(e => {
    let data = JSON.parse(e.data);
    let parsedData = {
      attestation: hex2a(data[0].slice(2)),
      identityHash: data[1],
      sender: data[2],
      identityType: (!isHex(data[3])) ? data[3] : hex2a(data[3].slice(2)),
      identity: hex2a(data[4].slice(2)),
      error: undefined,
    }

    if (parsedData.identityType in ['github', '\u0018github'] ) {
      githubEvents.push({
        identityType: 'github',
        ...parsedData,
      });
    } else if (parsedData.identityType in ['twitter', '\u0018twitter'] ) {
      twitterEvents.push({
        identityType: 'twitter',
        ...parsedData,
      })
    }
  });

  await Github.onReceiveEvents(remoteNodeUrl, githubEvents);
  await Twitter.onReceiveEvents(remoteNodeUrl, twitterEvents);
}

/**
 * Function for initializing all event emitter keys with response functions
 * @param remoteNodeUrl URL of remote edgeware node
 */
export const createEmitter = async (remoteNodeUrl: string) => {
  // Create new emitter and hook up event listeners
  const emitter = new EventEmitter.EventEmitter();
  emitter.on(EmitterEventKeys.IDENTITY_EVENT, (args) => processIdentityEvents(remoteNodeUrl, args));
  // Poll API for new events
  const api = await initApi(remoteNodeUrl);
  api.rpc.chain.subscribeNewHead(async (header) => {
    const events = await api.query.system.events.at(header.hash);
    // Filter and parse all identity events
    let idEvents = events
    .filter(({ event, phase }) => (event.section === 'identity'))
    .map(({ event, phase }) => {
      // Parse event object
      const eventObj = {
        section: event.section,
        method: event.method,
        meta: event.meta.documentation.toString(),
        data: event.data.toString()
      }
      // Remove this log if not needed
      console.log('Event Received: ' + Date.now() + ": " + JSON.stringify(eventObj));
      return eventObj;
    });
    // Emite identity events
    emitter.emit(EmitterEventKeys.IDENTITY_EVENT, idEvents);
  });
};