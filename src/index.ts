require('dotenv').config();
import '@babel/polyfill';
import * as watcher from './watcher';
import program from 'commander';

export const LOCALHOST = 'localhost:9944';
export const EDGEWARE_TESTNET = '18.223.143.102:9944';


program
  .version('0.1.0')
  .option('-w, --watch', 'Watch')
  .parse(process.argv);

if (program.watch) watcher.pollAllEvents(LOCALHOST);
