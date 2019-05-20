require('dotenv').config();
import { blake2AsHex } from "@polkadot/util-crypto";
import { u8aConcat } from "@polkadot/util";
import AES from 'crypto-js/aes';
import axios from 'axios';
import { Text } from '@polkadot/types';

const ENCRYPTION_KEY = 'commonwealth-identity-service';

export const encrypt = (data) => {
  const cipherText = AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  return cipherText;
}

const getRequestOptions = (gistData: any) => ({
  url: 'https://api.github.com/gists',
  method: 'post',
  data: JSON.stringify(gistData),
  auth: {
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_TOKEN,
  },
});

export const createGist = async (data) => {
  let identityHash = blake2AsHex(
    u8aConcat(
      new Text(data.identityType).toU8a(),
      new Text(data.identity).toU8a()
    )
  );

  const gistData = {
    public: true,
    description: 'Edgeware Identity Attestation',
    files: { proof: { content: encrypt({ identityHash: identityHash, ...data }) } }
  };

  try {
    const response = await axios(getRequestOptions(gistData));
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

createGist({
  identityType: 'github',
  identity: 'drewstone',
  sender: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
});