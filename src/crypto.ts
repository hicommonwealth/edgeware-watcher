import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';

const ENCRYPTION_KEY = 'commonwealth-identity-service';

export const encrypt = (data) => {
  const cipherText = AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  return cipherText;
}

export const decrypt = (data) => {
    const bytes = AES.decrypt(data, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
