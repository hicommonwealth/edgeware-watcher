import { blake2AsHex } from "@polkadot/util-crypto";
import { u8aConcat } from "@polkadot/util";
import { Text, Hash } from '@polkadot/types';
import { CodecArg } from "@polkadot/types/types";
import Keyring from "@polkadot/keyring";

export const hashTwo = (left: string, right: string) => {
  return blake2AsHex(
    u8aConcat(
      new Text(left).toU8a(),
      new Text(right).toU8a()
    )
  );
}

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