require('dotenv').config();
import axios from 'axios';
import { CodecArg } from '@polkadot/types/types';
import { Keyring } from '@polkadot/keyring';
import { Hash } from '@polkadot/types';
import initApi from '../api';
import * as db from '../db';
import { EdgewareIdentityEvent, IdentityResponseData } from '../eventemitter';
import { hashTwo } from '../common';
import Twit from 'twit';

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

const getRequestOptions = (gId: string) => ({
  url: `https://api.github.com/gists/${gId}`,
  headers: { 'User-Agent': 'request', 'Accept': 'application/vnd.github.v3+json' },
  method: 'get',
});

const insertAllEvents = async (events: Array<EdgewareIdentityEvent>) => {
  const promises = events.map(async e => (await db.insert(e)));
  await Promise.all(promises);
};

export const onReceiveEvents = async (remoteUrlString: string, events: Array<EdgewareIdentityEvent>) => {
  if (events.length === 0) return;
  // Parse Attest events
  let promises = events.map(async e => (await onReceiveEvent(remoteUrlString, e)));
  // Unwrap promises
  let processedEvents = await Promise.all(promises);
  console.log(`III | Processed events: ${JSON.stringify(processedEvents)}`);
  // verify successes
  await submitTransaction(
    remoteUrlString,
    processedEvents.filter(e => e.success)
                      .map(e => e.data.identityHash),
    true
  );
  // reject failures
  await submitTransaction(
    remoteUrlString,
    processedEvents.filter(e => !e.success)
                      .map(e => e.data.identityHash),
    false,
  );

  await insertAllEvents(events);
}

const formatError = (event: EdgewareIdentityEvent | IdentityResponseData, error: string) => 
  ({ success: false, data: { ...event, error: error } });

const onReceiveEvent = async (remoteUrlString: string, event: EdgewareIdentityEvent) => {
  
  const response = await T.get('statuses/show', { id: event.attestation });
  // Check whether the twitter account from the tweet matches the event's target identity
  if (event.identity !== response.data.user.screen_name.toString()) {
    return formatError(event, `Identity mismatch: $${response.data.user.screen_name.toString()} != ${event.identity}`);
  }
  // Extract out the hash from the content
  const proofDataHash = response.data.text.toString()
    .match(new RegExp('II (.*) II'))[1];
  // Hash event data for verifying hash equality
  const computedIdentityHash = hashTwo(event.identityType, event.identity);
  const computedTotalHash = hashTwo(event.sender, computedIdentityHash);
  // Check if the computed hash matches the posted hash
  if (proofDataHash !== computedTotalHash) {
    return formatError(event, `Identity mismatch: ${proofDataHash} != ${computedIdentityHash}`);
  }
  // Return the event upon success
  return { success: true, data: event };
};

const submitTransaction = async (remoteUrlString: string, identityHashes: Array<Hash>, approve: boolean) =>  {
  if (identityHashes.length === 0) return;
  console.log(`III | Submitting ${(approve) ? 'verify' : 'deny'} transaction: ${identityHashes}`);
  const cArgs: CodecArg[] = [identityHashes, process.env.VERIFIER_INDEX];
  const api = await initApi(remoteUrlString);
  const suri = `${process.env.MNEMONIC_PHRASE}${process.env.DERIVATION_PATH}`;
  const keyring = new Keyring({
    type: (process.env.DERIVED_KEY_TYPE === 'ed25519') ? 'ed25519' : 'sr25519'
  });
  const pair = keyring.addFromUri(suri);
  console.log(`III | Sending tx from verifier: ${pair.address()}`);
  const nonce = await api.query.system.accountNonce(pair.address());
  const fn = (approve) ? api.tx.identity.verifyMany : api.tx.identity.denyMany;
  return await fn(...cArgs)
  .sign(pair, { nonce })
  .send(async ({ events, status }) => {
    console.log('III | Transaction status:', status.type);

    if (status.isFinalized) {
      console.log('III | Completed at block hash', status.value.toHex());
      console.log('III | Events:');

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log('III | \t', phase.toString(), `: ${section}.${method}`, data.toString());
      });
    }
  });
};
