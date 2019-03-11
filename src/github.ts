import request from 'request';
import { isHex, hexToU8a, stringToU8a } from '@polkadot/util';
import { first, switchMap } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import * as crypto from './crypto';

const getRequestOptions = (gId: string) => ({
  url: `https://api.github.com/gists/${gId}`,
  headers: {
    'User-Agent': 'request',
    'Accept': 'application/vnd.github.v3+json',
  },
  method: 'GET',
});

export const processAttestEvent = async (api: ApiRx, event) => {
  let gistId = event;
  let txSender = event;
  request(getRequestOptions(gistId))
  .on('response', function(response) {
    console.log(response.statusCode) // 200
    console.log(response.headers['content-type']) // 'image/png'
  })
  .pipe(switchMap((response) => {
    let res = crypto.verifyAttestationWithGist(gistId, txSender, response);
    // Send verify attestion transactions using API
    return verifyIdentityAttestion(api, res.identityHash, res.success);
  }));
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
