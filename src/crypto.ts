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
