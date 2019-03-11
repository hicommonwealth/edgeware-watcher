import request from 'request';
import { isHex, hexToU8a, stringToU8a } from '@polkadot/util';
import { first, switchMap } from 'rxjs/operators';
import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256'
import { ApiRx } from '@polkadot/api';

export const processAttestEvent = async (api: ApiRx, event) => {
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
          return verifyIdentityAttestion(api, decryptedData.identityHash, false);
    }

    // Send verify attestion transactions using API
    return verifyIdentityAttestion(api, decryptedData.identityHash, true);
  }));
};

export const verifyIdentityAttestion = (api: ApiRx, identityHash, verifyBool) => {
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
        .verify(identityHash, verifyBool, process.VERIFIER_INDEX)
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
