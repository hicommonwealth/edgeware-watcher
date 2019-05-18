require('dotenv').config();
import '@babel/polyfill';
import { createEmitter, EmitterEventKeys } from './eventemitter';
import initApi from './api';
export const LOCALHOST = 'localhost:9944';
export const EDGEWARE_TESTNET = '18.223.143.102:9944';

const parseEvents = (events) => {
  // Filter and parse all identity events
  const idEvents: { section: any; method: any; data: any; }[] = [];
  events.forEach(({ event: { data, method, section } }) => {
    if (section === 'identity') {
      idEvents.push({
        section: section,
        method: method,
        data: data.toString(),
      });
    }
  });

  return {
    identity: idEvents,
  }
};

(async () => {
  const remoteNodeUrl = LOCALHOST;
  const emitter = await createEmitter(remoteNodeUrl);  // Poll API for new events
  const api = await initApi(remoteNodeUrl);
  // Create header fetcher
  const getHeaderAtIndex = async (index) => {
    const blockHash = await api.rpc.chain.getBlockHash(index);
    return await api.rpc.chain.getHeader(blockHash);
  };
  // Poll header
  let i = Number(process.env.LAST_BLOCK_PROCESSED) || 0;
  let header = await getHeaderAtIndex(i);
  while (header.hash.length > 0) {
    console.log(`EEE | Block: ${i}, Header: ${header.hash.toString()}`);
    try {
      const raw = await api.query.system.events.at(header.hash);
      const events = parseEvents(raw);
      // Emit identity events
      if (events.identity.length > 0) emitter.emit(EmitterEventKeys.IDENTITY_EVENT, {
        headerHash: header.hash.toString(),
        events: events.identity,
      });
      // Increment block number and poll new header
      header = await getHeaderAtIndex(i);
      i += 1;
    } catch (e) {
      console.log(`XXX | ${e.toString()}`);
      break;
    }
  }

  api.rpc.chain.subscribeNewHead(async (header) => {
    console.log(`EEE | Block: ${i}, Header: ${header.hash.toString()}`);
    // Get latest headers
    header = await api.rpc.chain.getHeader();
    // Emit identity events
    const raw = await api.query.system.events.at(header.hash);
    const events = parseEvents(raw);
    if (events.identity.length > 0) emitter.emit(EmitterEventKeys.IDENTITY_EVENT, {
      headerHash: header.hash.toString(),
      events: events.identity,
    });
    i += 1;
  });
})();