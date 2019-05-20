require('dotenv').config();
import '@babel/polyfill';
import { createEmitter, EmitterEventKeys } from './eventemitter';
import initApi from './api';
import { BlockNumber, Hash } from '@polkadot/types';
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
    const blockNumber = new BlockNumber(index);
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    return await api.rpc.chain.getHeader(new Hash(blockHash.toHex()));
  };
  // Poll header
  let i = Number(process.env.LAST_BLOCK_PROCESSED) || 0;
  while (i < (await api.derive.chain.bestNumber()).toNumber()) {
    const header = await getHeaderAtIndex(i);
    console.log(`EEE | Block: ${i}, Header: ${header.hash.toString()}`);
    // Get raw events
    const raw = await api.query.system.events.at(header.hash);
    // Parse and process events
    if (raw) {
      const events = parseEvents(raw);
      // Emit identity events
      if (events.identity.length > 0) emitter.emit(EmitterEventKeys.IDENTITY_EVENT, {
        headerHash: header.hash.toString(),
        events: events.identity,
      });
    }
    // Increment counter
    i += 1;
  }

  api.rpc.chain.subscribeNewHead(async (header) => {
    const blockNum = await api.derive.chain.bestNumber();
    console.log(`EEE | Block: ${blockNum}, Header: ${header.hash.toString()}`);
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