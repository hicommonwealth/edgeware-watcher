import Keyring from '@polkadot/keyring';
import { Vector, Hash } from '@polkadot/types';
import { isHex } from '@polkadot/util';
import * as db from './db';
import * as github from './github';
import * as watcher from './watcher';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const INTERVAL_LENGTH = ONE_MINUTE;

function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

export const poll = async (remoteUrlString: string) => {
  db.connect().then(async () => {
    // Every so often we poll the database for unprocessed events
    setInterval(async () => {
      let attestations = await db.findUnprocessedAttestations();
      // only execute processing if there are attestations
      if (attestations.length > 0) {
        console.log(`Processing ${attestations.length} attestions`);
        let results = await Promise.all(attestations.map(async attestation => {
          let data = JSON.parse(attestation.data)
          let parsedData = {
            attestation: hex2a(data[0].slice(2)),
            identityHash: data[1],
            sender: data[2],
            identityType: (!isHex(data[3])) ? data[3] : hex2a(data[3].slice(2)),
            identity: hex2a(data[4].slice(2)),
          }
  
          // Currently supporting github verifications only
          let success;
          if (parsedData.identityType === 'github') {
            success = await github.processAttestEvent(remoteUrlString, parsedData);
          } else {
            success = false;
          }
  
          return { attestation, parsedData, success };
        }));
  
        // Filter the verifications and denials into separate arrays
        const positiveHashes = results.filter(r => (r.success)).map(r => (r.parsedData.identityHash));
        const negativeHashes = results.filter(r => (!r.success)).map(r => (r.parsedData.identityHash));;
        const positiveAttestations = results.filter(r => (r.success)).map(r => (r.attestation));
        const negativeAttestations = results.filter(r => (!r.success)).map(r => (r.attestation));;
  
        if (positiveHashes.length > 0) {
          await verifyIdentityAttestion(remoteUrlString, positiveHashes, true, positiveAttestations);
        }
  
        if (negativeHashes.length > 0) {
          await verifyIdentityAttestion(remoteUrlString, negativeHashes, false, negativeAttestations);
        }
      }
    }, ONE_SECOND * 30)
  });
}

export const verifyIdentityAttestion = async (remoteUrlString: string, identityHashes: Vector<Hash>, approve: bool, attestations: any) =>  {
  const cArgs: CodecArg[] = [identityHashes, process.env.VERIFIER_INDEX];
  const api = await watcher.initApiPromise(remoteUrlString);
  const suri = `${process.env.MNEMONIC_PHRASE}${process.env.DERIVATION_PATH}`;
  const keyring = new Keyring({ type: 'ed25519' });
  const pair = keyring.addFromUri(suri);
  console.log(`Sending tx from verifier: ${pair.address()}`);
  const nonce = await api.query.system.accountNonce(pair.address());
  const fn = (approve) ? api.tx.identity.verifyMany : api.tx.identity.denyMany;
  return await fn(...cArgs)
  .sign(pair, { nonce })
  .send(async ({ events, status }) => {
    console.log('Transaction status:', status.type);

    if (status.isFinalized) {
      console.log('Completed at block hash', status.value.toHex());
      console.log('Events:');

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });

      // Once tx finalizes, mark as processed
      await db.processAttestations(attestations);
    }
  });
};
