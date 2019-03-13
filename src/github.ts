import request from 'request';
import { isHex, hexToU8a, stringToU8a, u8aConcat, compactAddLength } from '@polkadot/util';
import { first, switchMap } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import * as crypto from './crypto';
import { blake2AsHex } from '@polkadot/util-crypto';
import { Vector, Text, U8a } from '@polkadot/types';
import github from 'github-api';

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

export const createGist = async (data) => {
  let identityHash = blake2AsHex(
    u8aConcat(
      new Text(data.identityType).toU8a(),
      new Text(data.identity).toU8a()
    )
  )

  let encryptedContent = crypto.encrypt({
    identityHash: identityHash,
    ...data,
  });

  console.log(encryptedContent);
  var gh = new github({
     username: process.env.GITHUB_USERNAME,
     password: process.env.GITHUB_PASSWORD,
  });
  let gist = gh.getGist();
  let result = await gist.create({
    public: true,
    description: 'Edgeware Identity Attestation',
    files: {
      proof: {
        content: encryptedContent,
      }
    }
  });
  console.log(result);
  // }).then(function({data}) {
  //    // Promises!
  //    let createdGist = data;
  //    return gist.read();
  // }).then(function({data}) {
  //    let retrievedGist = data;
  //    // do interesting things
  // });
  // // let encryptedData = crypto.encrypt(data);  
}
