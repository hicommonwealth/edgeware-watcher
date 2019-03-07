import "@babel/polyfill";
import request from 'request';
import { ApiRx } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { IdentityTypes } from './types/identity';
import { VotingTypes } from './types/voting';
import { GovernanceTypes } from './types/governance';
import { ApiOptions } from '@polkadot/api/types';
import { first, switchMap } from 'rxjs/operators';
import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256'
import testingPairs from '@polkadot/keyring/testingPairs';

const keyring = testingPairs({ type: 'ed25519' });
const VERIFIER_INDEX = 0;

const EDGEWARE_TESTNET_ADDR_1 = "18.221.47.154:9944";
const EDGEWARE_TESTNET_ADDR_2 = "18.222.29.148:9944";
const EDGEWARE_TESTNET_ADDR_3 = "18.223.143.102:9944";

let seenBlocks = {}
let processingQueue = [];

const initApiRx = (remoteNodeUrl?: string) => {
  if (!remoteNodeUrl) {
    remoteNodeUrl = 'ws://localhost:9944';
  }

  if (remoteNodeUrl.indexOf('ws://') === -1) {
    remoteNodeUrl = `ws://${remoteNodeUrl}`;
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

export const start = async () => {
  const api = await initApiRx(EDGEWARE_TESTNET_ADDR_2).isReady.toPromise();
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
    .subscribe((events) => {
      events.forEach((record: any) => {
        // extract the phase, event and the event types
        const { event, phase } = record;
        const types = event.typeDef;
  
        // show what we are busy with
        console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
        console.log(`\t\t${event.meta.documentation.toString()}`);
        console.log(event);
        console.log(phase);
  
        if (event.section === 'identity') {
          processAttestEvent(api, event)
        }
      });
    });
  }, 2000)
};


export const processAttestEvent = async (api, event) => {
  const getRequestOptions = (gId: string) => ({
    url: `https://api.github.com/gists/${gId}`,
    headers: {
      'User-Agent': 'request',
      'Accept': 'application/vnd.github.v3+json',
    },
    method: 'GET',
  });
  let gistId = event;
  let eventTxSender = event;
  request(getRequestOptions(gistId))
  .on('response', function(response) {
    console.log(response.statusCode) // 200
    console.log(response.headers['content-type']) // 'image/png'
  })
  .pipe(switchMap((response) => {
    const content = response.files.proof.content;
    const bytes  = AES.decrypt(content, 'commonwealth-identity-service');
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    if (decryptedData.idHash != SHA256(gistId) ||
        decryptedData.author != response.owner.login ||
        decryptedData.sender != eventTxSender) {
      return handleInvalidAttestation(api, decryptedData);
    }

    // Send verify attestion transactions using API
    return handleValidAttestation(api, decryptedData);
  }));
};

export const handleValidAttestation = (api, plainObj) => {
  // TODO: Parse identity hash out of plainObj correctly
  return verifyIdentityAttestion(plainObj.identityHash, true, VERIFIER_INDEX);
}

export const handleInvalidAttestation = (api, plainObj) => {
  // TODO: Parse identity hash out of plainObj correctly
  return verifyIdentityAttestion(plainObj.identityHash, false, VERIFIER_INDEX);
};

export const verifyIdentityAttestion = (api, identityHash, verifyBool) => {
  api.query.system
  // TODO: Add function for reading local key storage
  .accountNonce(keyring.alice.address())
  .pipe(
    first(),
    switchMap((nonce) =>
      api.tx.identity
        .verify(identityHash, verifyBool, VERIFIER_INDEX)
        .sign(keyring.alice, { nonce })
        .send()
    )
  )
  .subscribe((status) => {
    if (status && status.type === 'Finalised') {
      console.log(`Done!`);
    }
  });
};

start();
