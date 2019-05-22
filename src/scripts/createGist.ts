require('dotenv').config();
import axios from 'axios';
import { hashTwo } from '../common';

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
  let identityHash = hashTwo(data.identityType, data.identity);
  let totalHash = hashTwo(data.sender, identityHash);

  const gistData = {
    public: true,
    description: 'Edgeware Identity Attestation',
    files: { proof: { content: `Attesting to my edgeware account: II ${totalHash} II` } },
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