import * as db from './db';
import * as github from './github';
import * as watcher from './watcher';
const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const INTERVAL_LENGTH = ONE_MINUTE

export const poll = async (remoteUrlString?: string) => {
  db.connect().then(async () => {
    const api = await watcher.initApiRx(remoteUrlString)
      .isReady
      .toPromise();
    // Every so often we poll the database for unprocessed events
    setInterval(async () => {
      let attestations = await db.findUnprocessedAttestations();

      if (attestations.length > 0) {
        console.log(`Processing ${attestations.length} attestions`);
      }

      await Promise.all(attestations.map(async a => {
        let success = await github.processAttestEvent(api, a);
        // If success, mark event as processed in the database
        if (success) {
          await db.processAttestation(a);
        }
      }))
    }, ONE_SECOND)
  });
}
