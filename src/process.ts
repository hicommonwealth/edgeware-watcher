import db from './db';
import * as github from './github';
import * as watcher from './watcher';
const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const INTERVAL_LENGTH = ONE_MINUTE

const start = async () => {
  db.connect().then(() => {
    // Every so often we poll the database for unprocessed events
    setInterval(async () => {
      let attestations = await db.findUnprocessedAttestations();
      const api = await initApiRx(`ws://${process.env.SUBSTRATE_HOST}:${process.env.SUBSTRATE_PORT}`).isReady.toPromise();
      await Promise.all(attestations.map(async a => {
        console.log(a);
        let success = await github.processAttestEvent(api, a);
        
        // If success, mark event as processed in the database
        if (success) {
          await db.processAttestation(a);
        }
      }))
    }, INTERVAL_LENGTH)
  });
}