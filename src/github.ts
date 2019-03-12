import request from 'request';
import { isHex, hexToU8a, stringToU8a } from '@polkadot/util';
import { first, switchMap } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import * as crypto from './crypto';
import { blake2AsHex } from '@polkadot/util-crypto';

const getRequestOptions = (gId: string) => ({
  url: `https://api.github.com/gists/${gId}`,
  headers: {
    'User-Agent': 'request',
    'Accept': 'application/vnd.github.v3+json',
  },
  method: 'GET',
});

export const processAttestEvent = async (api: ApiRx, event) => {
  let gistId = event.attestation;
  let txSender = event.sender;

  const handleCallback = (err, res, body) => {
    let data = JSON.parse(body);
    let success = crypto.verifyAttestationWithGist(gistId, txSender, data);
    // Send verify attestion transactions using API
    return verifyIdentityAttestion(api, event.identityHash, success);
  }

  request(getRequestOptions(gistId), handleCallback);
};

export const verifyIdentityAttestion = (api: ApiRx, identityHash, verifyBool) =>  {
  const keyring = new Keyring();
  // TODO: make sure seed is properly formatted (32 byte hex string)
  const seedStr = process.env.PRIVATE_KEY_SEED.padEnd(32, ' ');
  const seed = isHex(process.env.PRIVATE_KEY_SEED) ? hexToU8a(seedStr) : stringToU8a(seedStr);
  const user = keyring.addFromSeed(seed);

  api.query.system
  // TODO: Add function for reading local key storage
  .accountNonce(keyring.alice.address())
  .pipe(
    first(),
    switchMap((nonce) =>
      api.tx.identity
        .verify(identityHash, verifyBool, process.env.VERIFIER_INDEX)
        .sign(keyring, { nonce })
        .send()
    )
  )
  .subscribe((status) => {
    if (status && status.type === 'Finalised') {
      console.log(`Done!`);
      return true;
    } else {
      return false;
    }
  });
};

export const createGist = (data) => {
  //0x995e957d368c817e5d64eab9757991a10001d8c6f3733646824da2c006ecc64e
  let idTypeHex = hexToU8a(data.identityType.toString('hex'));
  let idHex = hexToU8a(data.identity.toString('hex'));
  console.log(idTypeHex, idHex);
  let identityHash = blake2AsHex(`${data.identityType}${data.identity}`, 256);
  console.log(identityHash);
  // let encryptedData = crypto.encrypt(data);  
}
