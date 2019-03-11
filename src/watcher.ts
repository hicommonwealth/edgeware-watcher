import request from 'request';
import { ApiRx } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { IdentityTypes } from './types/identity';
import { VotingTypes } from './types/voting';
import { GovernanceTypes } from './types/governance';
import { ApiOptions } from '@polkadot/api/types';
import { switchMap } from 'rxjs/operators';

let seenBlocks = {}
let processingQueue = [];

const getEventSections = () => {
  return [
    'all'
  ];
}

const initApiRx = (remoteNodeUrl?: string) => {
  if (!remoteNodeUrl) {
    remoteNodeUrl = 'ws://localhost:9944';
  }

  if (remoteNodeUrl.indexOf('ws://') === -1) {
    remoteNodeUrl = `ws://${remoteNodeUrl}`;
  }

  if (remoteNodeUrl.indexOf(':9944') === -1) {
    remoteNodeUrl = `${remoteNodeUrl}:9944`;
  }

  const options: ApiOptions = {
    provider : new WsProvider(remoteNodeUrl),
    types : {
      ...IdentityTypes,
      ...GovernanceTypes,
      ...VotingTypes,
    },
  };
  const api = new ApiRx(options);
  return api;
};

export const pollAllEvents = async (remoteNodeUrl?: string) => {
  // get event filters
  const eventsFilter = getEventSections();
  // get api
  const api = await initApiRx(remoteNodeUrl).isReady.toPromise();
  api.query.system.events()
  .subscribe(handleEventSubscription);
}

export const pollInIntervals = async (remoteNodeUrl?: string) => {
  // get api
  const api = await initApiRx(remoteNodeUrl).isReady.toPromise();
  setInterval(() => {
    api.rpc.chain
    .getHeader()
    .pipe(
      switchMap((header) => {
        let blockNumber = JSON.parse(header.toString()).number;
        if (blockNumber in seenBlocks) {
            return;
        } else {
            seenBlocks[blockNumber] = header;
            return api.query.system.events.at(header.hash);
        }
      })
    )
    .subscribe(handleEventSubscription);
  }, 2000)
};

const handleEventSubscription = async (events) => {
  // get event filters
  const eventsFilter = getEventSections();
  events.forEach(async (record) => {
    // extract the event object
    const { event, phase } = record;
    // check section filter
    if (eventsFilter.includes(event.section.toString()) || eventsFilter.includes("all")) {
      // create event object for data sink
      const eventObj = {
        section: event.section,
        method: event.method,
        meta: event.meta.documentation.toString(),
        data: event.data.toString()
      }

      // remove this log if not needed
      console.log('Event Received: ' + Date.now() + ": " + JSON.stringify(eventObj));
    }
  });
};
