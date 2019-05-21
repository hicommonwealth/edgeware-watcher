require('dotenv').config();
import { error } from 'console';
import { hashTwo } from '../common';

var Twit = require('twit');
const consumerKey = process.env.TWITTER_CONSUMER_KEY;
const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

const T = new Twit({
  consumer_key: consumerKey,
  consumer_secret: consumerSecret,
  access_token: accessToken,
  access_token_secret: accessTokenSecret,
});

export const createTweet = async (data) => {
  let identityHash = hashTwo(data.identityType, data.identity);
  let totalHash = hashTwo(data.sender, identityHash);
  const content = `Attesting to my edgeware account: II ${totalHash} II`;
  //(url, oauth_token, oauth_token_secret, post_body, post_content_type, callback 
  T.post('statuses/update', {status: content}, tweetCallback);
}

const tweetCallback = (err, tweet, response) => {
  if (!err && response.statusCode == 200) {
      console.log(tweet);
  } else {
      error(err, response, tweet);
  }
}

createTweet({
  identityType: 'github',
  identity: 'drewstone',
  sender: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
});