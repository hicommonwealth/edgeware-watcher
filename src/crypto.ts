import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256'

const KEY = 'commonwealth-identity-service';

export const encrypt = (data) => {
  const cipherText = AES.encrypt(JSON.stringify(data), KEY).toString();
  return cipherText;
}

export const decrypt = (data) => {
    const bytes = AES.decrypt(data, KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

export const verifyAttestationWithGist = (gistId: string, txSender: string, data: any) => {
  if (!data.hasOwnProperty('files') ||
      !data.hasOwnProperty('owner') ||
      !data.files.hasOwnProperty('proof') ||
      !data.files.proof.hasOwnProperty('content')
  ) {
    return false;
  }

  const content = data.files.proof.content;
  let decryptedData = decrypt(content);
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
