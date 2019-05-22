require('dotenv').config();
import axios from 'axios';
import { hashTwo } from '../common';
import Twit from 'twit';

const consumerKey = process.env.TWITTER_CONSUMER_KEY;
const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

function calcHMAC(input, inputKey) { //MUST place this function below the block of yucky code above
  //currently set up to take inputText and inputKey as text and give output as SHA-1 in base64
  //var inputText = 'stuff you want to convert'; //must be text, if you use Base64 or HEX then change hmacInputType on line 34
  //var inputKey = 'key to use in conversion'; //must be text, if you use Base64 or HEX then change hmacKeyInputType on line 35
  try {
      var hmacInputType = 'TEXT'; //other values: B64, HEX
      var hmacKeyInputType = 'TEXT'; //other values: B64, HEX
      var hmacVariant = 'SHA-1'; //other values NOT SUPPORTED because js for it was stripped out of the src code for optimization: SHA-224, SHA-256, SHA-384, SHA-512
      var hmacOutputType = 'B64';
      var hmacObj = new jsSHA(input, hmacInputType);
      
      return hmacObj.getHMAC(
          inputKey,
          hmacKeyInputType,
          hmacVariant,
          hmacOutputType
      );
  } catch(e) {
      return e
  }
}

const makeid = (length) => {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const getRequestOptions = (status: any, uri: string, key: any, timestamp: number) => ({
  url: 'https://api.twitter.com/1.1/statuses/update.json',
  method: 'post',
  status: encodeURI(status),
  header: {
    Authorization:          'OAuth',
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            makeid(32),
    oauth_signature:        calcHMAC(uri, key),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        timestamp,
    oauth_token:            accessToken,
    oauth_version:          '1.0',
  },
});

export const createTweet = async (data) => {
  let identityHash = hashTwo(data.identityType, data.identity);
  let totalHash = hashTwo(data.sender, identityHash);
  const content = `Attesting to my edgeware account: II ${totalHash} II`;
  var date = new Date();
  var timestamp = date.getTime();
  const key = `${consumerSecret}${accessTokenSecret}`;
  return await axios(getRequestOptions(content, key, timestamp));
}

createTweet({
  identityType: 'twitter',
  identity: 'drew___stone',
  sender: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
});