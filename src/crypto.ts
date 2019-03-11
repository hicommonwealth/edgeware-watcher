import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256'

const KEY = 'commonwealth-identity-service';

export const encrypt = (data) => {
    if (!data.hasOwnProperty('idHash') ||
      !data.hasOwnProperty('githubAccount') ||
      !data.hasOwnProperty('identityHash') ||
      !data.hasOwnProperty('sender')
    ) {
      console.log(`Data is inproperly formatted: ${data}`);
      process.exit(-1);
    } else {
      const cipherText = AES.encrypt(data, KEY).toString();
      return cipherText;
    }
}

export const decrypt = (data) => {
    const bytes = AES.decrypt(data, KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

export const verifyAttestationWithGist = (gistId, txSender, response) => {
    const content = response.files.proof.content;
    let decryptedData = decrypt(content);
    // Check sufficient conditions for verifying attestations
    if (decryptedData.idHash != SHA256(gistId) ||
      decryptedData.githubAccount != response.owner.login ||
      decryptedData.sender != txSender
    ) {
      return {
        identityHash: decryptedData.identityHash,
        success: true,
      };
    } else {
      return {
        identityHash: decryptedData.identityHash,
        success: false,
      };
    }
}
