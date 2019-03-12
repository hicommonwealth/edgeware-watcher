require('dotenv').config();
import '@babel/polyfill';
import * as watcher from './watcher';
import * as processor from './process';
import program from 'commander';

export const LOCALHOST = 'localhost:9944';
export const EDGEWARE_TESTNET_ADDR_1 = '18.221.47.154:9944';
export const EDGEWARE_TESTNET_ADDR_2 = '18.222.29.148:9944';
export const EDGEWARE_TESTNET_ADDR_3 = '18.223.143.102:9944';


program
  .version('0.1.0')
  .option('-w, --watch', 'Watch')
  .option('-p, --process', 'Process')
  .parse(process.argv);

if (program.watch) watcher.pollInIntervals(LOCALHOST);
if (program.process) processor.poll(LOCALHOST);
