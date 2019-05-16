import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import axios from 'axios';
import { u8aConcat, assert, u8aToU8a } from '@polkadot/util';
import { blake2AsHex } from '@polkadot/util-crypto';
import { CodecArg } from '@polkadot/types/types';
import { Keyring } from '@polkadot/keyring';

import { insert } from '../db';
import initApi from '../api';

const IDENTITY_ENCRYPTION_KEY = 'commonwealth-identity-service';

const hashIdentity = (identityType: string, identity: string) => {
  return blake2AsHex(
    u8aConcat(
      new Text(identityType).toU8a(),
      new Text(identity).toU8a()
    )
  );
}

type GithubEdgewareEvent = {
  attestation: string,
  sender: string,
}

type GithubResponseData = {
  identityType: string,
  identity: string,
  sender: string,
  proof: string,
  description: string,
  attestation: string,
}

const getRequestOptions = (gId: string) => ({
  url: `https://api.github.com/gists/${gId}`,
  headers: { 'User-Agent': 'request', 'Accept': 'application/vnd.github.v3+json' },
  method: 'get',
});

const onReceiveEvent = (remoteUrlString: string) => async (event: GithubEdgewareEvent) => {
  try {
    const response = await axios(getRequestOptions(event.attestation));
    if (response.data.hasOwnProperty('files')) {
      if (response.data.files.hasOwnProperty('proof')) {
        if (!response.data.files.hasOwnProperty('content')) {
          return Promise.reject(`Malformed response data: ${JSON.stringify(response.data)}`);
        }
      }
    }

    if (response.data.description !== 'Edgeware Identity Attestation') {
      return Promise.reject(`Incorrect attestation description: ${response.data.description}`);
    }

    await processEvent(remoteUrlString)({
      identityType: 'github',
      identity: response.data.owner.login.toString(),
      sender: event.sender,
      proof: response.data.files.proof.content.toString(),
      description: response.data.description,
      attestation: event.attestation,
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

const processEvent = (remoteUrlString: string) => async (data: GithubResponseData) => {
  const bytes = AES.decrypt(data.proof, IDENTITY_ENCRYPTION_KEY);
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const computedIdentityHash = hashIdentity(data.identityType, data.identity);

  if (decryptedData.identityType !== 'github' || decryptedData.identityType !== '\u0018github') {
    await verifyIdentityAttestion(remoteUrlString)(decryptedData.identityHash.toString(), false);
    return Promise.reject(`Invalid identity type: ${decryptedData.identityType}`);
  } else if (decryptedData.identity !== data.identity) {
    await verifyIdentityAttestion(remoteUrlString)(decryptedData.identityHash.toString(), false);
    return Promise.reject(`Invalid identity: ${decryptedData.identity} != ${data.identity}`);
  } else if (decryptedData.sender !== data.sender) {
    await verifyIdentityAttestion(remoteUrlString)(decryptedData.identityHash.toString(), false);
    return Promise.reject(`Invalid Edgeware sender: ${decryptedData.sender} != ${data.sender}`); 
  } else if (decryptedData.identityHash !== computedIdentityHash) {
    await verifyIdentityAttestion(remoteUrlString)(decryptedData.identityHash.toString(), false);
    return Promise.reject(`Invalid identity hash: ${decryptedData.identityHash} != ${computedIdentityHash}`)
  }

  await insert(data);
  await verifyIdentityAttestion(remoteUrlString)(decryptedData.identityHash.toString(), true)
};

const verifyIdentityAttestion = (remoteUrlString: string) => async (identityHash: string, approve: boolean) =>  {
  const cArgs: CodecArg[] = [identityHash, process.env.VERIFIER_INDEX];
  const api = await initApi(remoteUrlString);
  const suri = `${process.env.MNEMONIC_PHRASE}${process.env.DERIVATION_PATH}`;
  const keyring = new Keyring({ type: 'ed25519' });
  const pair = keyring.addFromUri(suri);
  console.log(`Sending tx from verifier: ${pair.address()}`);
  const nonce = await api.query.system.accountNonce(pair.address());
  const fn = (approve) ? api.tx.identity.verify : api.tx.identity.deny;
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
    }
  });
};

export default (remoteUrlString: string) => ({
  onReceiveEvent(remoteUrlString),
});