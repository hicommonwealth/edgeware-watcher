import { blake2AsHex } from "@polkadot/util-crypto";
import { u8aConcat } from "@polkadot/util";
import { Text } from '@polkadot/types';

export const hashTwo = (left: string, right: string) => {
  return blake2AsHex(
    u8aConcat(
      new Text(left).toU8a(),
      new Text(right).toU8a()
    )
  );
}