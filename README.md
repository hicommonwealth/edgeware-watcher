# edgeware-watcher
The edgeware watcher is an event listener for storing and processing Edgeware events. The watcher serves two main roles: one is watching and storing events in a MongoDB database and another is processing new events added to the database by any external means (such as executing a transaction based off event data).

The first instantiation of the watcher is meant to serve as a daemon for Commonwealth's Identity Verification Service. Our validating nodes will have authority to verify identities that are registered on Edgeware. We will analyze Github attestations that users submit on-chain, ensuring that the attestations are valid proofs of ownership over Github accounts. This marks the first step towards implementing Edgeware's identity vision.

Included in this repo is the ability to create gists as well. In order to play around with functionality that requires Github authentication, add the necessary Github environment variables to the `.env` file described below.

# Configuration
Create a `.env` file in the root directory with the following information.
```
# Substrate node config for connecting to a live local or remote node
SUBSTRATE_HOST=localhost
SUBSTRATE_PORT=9944
# Substrate events config
SUBSTRATE_EVENT_SECTIONS=all

# MongoDB config for storing event data
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=substrate_events
MONGO_COLLECTION=event_data

# Edgeware config for executing verification transactions
VERIFIER_INDEX=0
MNEMONIC_PHRASE="bottom drive obey lake curtain smoke basket hold race lonely fit walk"
DERIVATION_PATH=//Alice

# Github config for creating gists
GITHUB_USERNAME=blahblah
GITHUB_PASSWORD=1234567890
```
# Usage
Ensure you have mongodb installed locally or have a remote node you can configure with in the configuration settings above. Install the node modules using `yarn` or `npm`.
To run the watcher (which by default polls for all events and prints them)
```
yarn start
```
To run the processor (only Github attestations currently)
```
yarn process
```

# Github Attestations
A github attestation is simply the gist ID. An example of a valid gist should contain the following properties. It should first and foremost be public and have the stated description. It should then contain a proof with an encrypted blob of content defined below this current snippet.
```
{
  public: true,
  description: 'Edgeware Identity Attestation',
  files: {
    proof: {
      content: encryptedContent,
    }
  },
  ...
}
```
The decrypted content should must contain the following data to be valid: the identityType (github), the github identity reported on-chain which must match that of the creator of the gist, the Edgeware base 58 encoded public address, and the Blake2 hash of the concatenated identity type and identity.
```
{
  identityHash: "0x995e957d368c817e5d64eab9757991a10001d8c6f3733646824da2c006ecc64e",
  identityType: "github",
  identity: "drewstone",
  sender: "5ERmnP13Gx8ybq64pi2LEGWVqF2AoRCM83UovE9537uRvLA8",
}
```
The has can be computed using the following snippet:
```
import { u8aConcat } from '@polkadot/util';
import { blake2AsHex } from '@polkadot/util-crypto';

let identityHash = blake2AsHex(
  u8aConcat(
    new Text(data.identityType).toU8a(),
    new Text(data.identity).toU8a()
  )
)
```

# Support checklist
The `edgeware-watcher` supports the following identity attestation events
[x] - Github attestations
