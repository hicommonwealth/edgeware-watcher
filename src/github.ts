import axios from 'axios';
import { isHex, hexToU8a, stringToU8a, u8aConcat, compactAddLength } from '@polkadot/util';
import { blake2AsHex } from '@polkadot/util-crypto';
import github from 'github-api';
import * as watcher from './watcher';
import * as crypto from './crypto';

const getRequestOptions = (gId: string) => ({
  url: `https://api.github.com/gists/${gId}`,
  headers: {
    'User-Agent': 'request',
    'Accept': 'application/vnd.github.v3+json',
  },
  method: 'get',
});

export const processAttestEvent = async (remoteUrlString: string, event) => {
  let gistId = event.attestation;
  let txSender = event.sender;

  const response = await axios(getRequestOptions(gistId));
  return (response.status !== 200)
    ? false
    : verifyAttestationWithGist(gistId, txSender, response.data);
};

export const verifyAttestationWithGist = (gistId: string, txSender: string, data: any) => {
  if (!data.hasOwnProperty('files') ||
      !data.hasOwnProperty('owner') ||
      !data.files.hasOwnProperty('proof') ||
      !data.files.proof.hasOwnProperty('content') ||
      !data.hasOwnProperty('description')
  ) {
    return false;
  }

  if (data.description != 'Edgeware Identity Attestation') {
    return false;
  }

  const content = data.files.proof.content;
  let decryptedData = crypto.decrypt(content);
  // Check sufficient conditions for verifying attestations
  if (decryptedData.identityType == 'github' ||
      decryptedData.identity == data.owner.login ||
      decryptedData.sender == txSender
  ) {
    return true;
  } else {
    return false;
  }
}


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
