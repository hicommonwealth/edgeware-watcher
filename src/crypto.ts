import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256'

export const decrypt = (data) => {
    const bytes  = AES.decrypt(data, 'commonwealth-identity-service');
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

export const verifyAttestationWithGist = (gistId, txSender, response) => {
    const content = response.files.proof.content;
    let decryptedData = decrypt(content);
    // Check sufficient conditions for verifying attestations
    if (decryptedData.idHash != SHA256(gistId) ||
        decryptedData.author != response.owner.login ||
        decryptedData.sender != txSender)
    {
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