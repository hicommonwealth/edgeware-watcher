import "@babel/polyfill";
import * as watcher from './watcher';

const EDGEWARE_TESTNET_ADDR_1 = "18.221.47.154:9944";
const EDGEWARE_TESTNET_ADDR_2 = "18.222.29.148:9944";
const EDGEWARE_TESTNET_ADDR_3 = "18.223.143.102:9944";

watcher.pollAllEvents(EDGEWARE_TESTNET_ADDR_2);