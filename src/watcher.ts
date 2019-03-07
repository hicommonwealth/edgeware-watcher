const { ApiRx, WsProvider } = require('@polkadot/api');
import Identity from './types/identity';
import Governance from './types/governance';
import Voting from './types/voting';


export const start = async () => {
  // initialise via Promise & static create
  const api = await ApiRx.create({
    provider: new WsProvider('wss://127.0.0.1:9944'),
    types: {
      ...Identity.IdentityTypes,
      ...Governance.GovernanceTypes,
      ...Voting.VotingTypes,
    }
  }).toPromise();

  // make a call to retrieve the current network head
  api.rpc.chain.subscribeNewHead().subscribe((header) => {
    console.log(`Chain is at #${header.blockNumber}`);
  });

  api.query.system.events().subscribe((events) => {
    // loop through the Vec<EventRecord>
    events.forEach((record) => {
      // extract the phase, event and the event types
      const { event, phase } = record;
      const types = event.typeDef;

      // show what we are busy with
      console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
      console.log(`\t\t${event.meta.documentation.toString()}`);

      // loop through each of the parameters, displaying the type and data
      event.data.forEach((data, index) => {
        console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
      });
    });
  });
};