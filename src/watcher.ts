import { ApiRx, ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { IdentityTypes } from './edgeware-node-types/types/identity';
import { VotingTypes } from './edgeware-node-types/types/voting';
import { GovernanceTypes } from './edgeware-node-types/types/governance';
import { ApiOptions } from '@polkadot/api/types';
import { switchMap } from 'rxjs/operators';
import { empty, of } from 'rxjs';

import * as db from './db';

let seenBlocks = {}
let processingQueue = [];

const getEventSections = () => {
  return [
    'all'
  ];
}

export const initApiRx = (remoteNodeUrl?: string) => {
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
  return api.isReady;
};

export const initApiPromise = (remoteNodeUrl?: string) => {
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
  const api = new ApiPromise(options);
  return api.isReady;
};

export const pollAllEvents = async (remoteNodeUrl?: string) => {
  // get event filters
  const eventsFilter = getEventSections();
  // get api
  const api = await initApiPromise(remoteNodeUrl);
  api.rpc.chain.subscribeNewHead(async (header) => {
    const events = await api.query.system.events.at(header.hash);
    await handleEventSubscription(events);
  });
}

const handleEventSubscription = async (events) => {
  // get event filters
  const eventsFilter = getEventSections();
  console.log(events.length);
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
      await db.insert(eventObj);
    }
  });
};
