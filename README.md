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
DERIVED_KEY_TYPE=sr25519

# Github config for creating gists
GITHUB_USERNAME=blahblah
GITHUB_PASSWORD=1234567890
# Twitter config
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=
```
# Usage
Ensure you have mongodb installed locally or have a remote node you can configure with in the configuration settings above. Install the node modules using `yarn` or `npm`.

To run the watcher:
```
yarn start
```
```

# Github Attestations
A github attestation is the Gist ID.

# Twitter Attestations
A twitter attestation is the Twitter tweet ID.

# Support checklist
The `edgeware-watcher` supports the following identity attestation events
[x] - Github attestations
[x] - Twitter attestations