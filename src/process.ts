import * as db from './db';
import * as github from './github';
import * as watcher from './watcher';
const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const INTERVAL_LENGTH = ONE_MINUTE

function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

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
        let data = JSON.parse(a.data)
        let parsedData = {
          _id: data._id,
          attestation: hex2a(data[0].slice(2)),
          identityHash: data[1],
          sender: data[2],
          identityType: hex2a(data[3].slice(2)),
          identity: hex2a(data[4].slice(2)),
        }

        let success = await github.processAttestEvent(api, parsedData);
        // If success, mark event as processed in the database
        if (success) {
          await db.processAttestation(a);
        }
      }))
    }, ONE_SECOND)
  });
}
