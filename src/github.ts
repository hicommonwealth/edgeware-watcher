import request from 'request';
import { isHex, hexToU8a, stringToU8a, u8aConcat, compactAddLength } from '@polkadot/util';
import { first, switchMap } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import { blake2AsHex } from '@polkadot/util-crypto';
import { Vector, Text, U8a, Hash } from '@polkadot/types';
import github from 'github-api';
import * as watcher from './watcher';
import * as crypto from './crypto';

const getRequestOptions = (gId: string) => ({
  url: `https://api.github.com/gists/${gId}`,
  headers: {
    'User-Agent': 'request',
    'Accept': 'application/vnd.github.v3+json',
  },
  method: 'GET',
});

export const processAttestEvent = async (remoteUrlString: string, event) => {
  let gistId = event.attestation;
  let txSender = event.sender;

  const handleCallback = async (err, res, body) => {
    let data = JSON.parse(body);
    let success = crypto.verifyAttestationWithGist(gistId, txSender, data);
    // Send verify attestion transactions using API
    return await verifyIdentityAttestion(remoteUrlString, event.identityHash, success);
  }

  return request(getRequestOptions(gistId), handleCallback);
};

export const verifyIdentityAttestion = async (remoteUrlString: string, identityHash: Hash, approve: bool) =>  {
  const cArgs: CodecArg[] = [`${identityHash}`, approve, 1];
  const api = await watcher.initApiPromise(remoteUrlString);

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  let pair;
  if (chain.toString() === 'Development') {
    const keyring = new Keyring({ type: 'sr25519' });
    pair = keyring.addFromUri(`${process.env.MNEMONIC_PHRASE}${process.env.DERIVATION_PATH}`);
  } else {
    const keyring = new Keyring({ type: 'ed25519' });
    pair = keyring.addFromUri(`${process.env.MNEMONIC_PHRASE}${process.env.DERIVATION_PATH}`);
  }

  const nonce = await api.query.system.accountNonce(pair.address());
  const fn = (approve) ? api.tx.identity.verify : api.tx.identity.deny;
  await fn(...cArgs)
  .sign(pair, { nonce })
  .send(({ events, status }) => {
    console.log(events, status);
    console.log('Transaction status:', status.type);

    if (status.isFinalized) {
      console.log('Completed at block hash', status.value.toHex());
      console.log('Events:');

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      });

      if (events.length) {
        done();
      }
    }
  });

  console.log(result, cArgs);
  process.exit(-1);
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
}
