# edgeware-watcher
The edgeware watcher is an event listener for storing and processing Edgeware events. The watcher serves two main roles: one is watching and storing events in a MongoDB database and another is processing new events added to the database by any external means (such as executing a transaction based off event data).

The first instantiation of the watcher is meant to serve as a daemon for Commonwealth's Identity Verification Service. Our validating nodes will have authority to verify identities that are registered on Edgeware. We will analyze Github attestations that users submit on-chain, ensuring that the attestations are valid proofs of ownership over Github accounts. This marks the first step towards implementing Edgeware's identity vision.

# Configuration
Create a `.env` file in the root directory with the following information.
```
# Substrate node config
SUBSTRATE_HOST=localhost
SUBSTRATE_PORT=9944
# Substrate events config
SUBSTRATE_EVENT_SECTIONS=all

# MongoDB config
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=substrate_events
MONGO_COLLECTION=event_data
```
# Usage
Ensure you have mongodb installed locally or have a remote node you can configure with in the configuration settings above. Install the node modules using `yarn` or `npm`.
To run the watcher (which by default polls for all events and prints them)
`yarn start`