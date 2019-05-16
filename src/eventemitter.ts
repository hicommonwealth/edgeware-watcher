import { EventEmitter } from 'events';
import setupProcessors from './processors';

/**
 * This is where you hook up your event keys
 */
export const EmitterEventKeys = {
  GITHUB_ATTESTATION_EVENT: 'edgeware-identity-github-attestation',
  TWITTER_ATTESTATION_EVENT: 'edgeware-identity-twitter-attestation',
}

/**
 * This is where you hook up your processors
 */
const EmitterConfig = (remoteUrlString: string) => {
  const { Github, Twitter } = setupProcessors(remoteUrlString);
  return {
    GITHUB_ATTESTATION_EVENT: Github.onReceiveEvent,
    TWITTER_ATTESTATION_EVENT: Twitter.onReceiveEvent,
  }
};

/**
 * Function for initializing all event emitter keys with response functions
 * @param remoteUrlString URL of remote edgeware node
 */
export const createEmitter = (remoteUrlString: string) => {
  const emitter = new EventEmitter.EventEmitter();
  Object.keys(EmitterEventKeys).forEach(key => {
    emitter.on(EmitterEventKeys[key], EmitterConfig(remoteUrlString)[key]);
  })
};