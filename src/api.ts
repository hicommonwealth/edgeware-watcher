import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { IdentityTypes } from './edgeware-node-types/types/identity';
import { VotingTypes } from './edgeware-node-types/types/voting';
import { GovernanceTypes } from './edgeware-node-types/types/governance';
import { ApiOptions } from '@polkadot/api/types';

export default (remoteNodeUrl?: string) => {
  if (!remoteNodeUrl) {
    remoteNodeUrl = 'ws://localhost:9944';
  }

  if (remoteNodeUrl.indexOf('ws://') === -1) {
    remoteNodeUrl = `ws://${remoteNodeUrl}`;
  }

  if (remoteNodeUrl.indexOf(':9944') === -1) {
    remoteNodeUrl = `${remoteNodeUrl}:9944`;
  }

  const options: ApiOptions = {
    provider : new WsProvider(remoteNodeUrl),
    types : {
      ...IdentityTypes,
      ...GovernanceTypes,
      ...VotingTypes,
    },
  };
  const api = new ApiPromise(options);
  return api.isReady;
};
