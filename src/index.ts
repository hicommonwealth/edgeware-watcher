require('dotenv').config();
import '@babel/polyfill';
import * as watcher from './watcher';
import * as processor from './process';
import * as github from './github';
import program from 'commander';

export const LOCALHOST = 'localhost:9944';
export const EDGEWARE_TESTNET_ADDR_1 = '18.221.47.154:9944';
export const EDGEWARE_TESTNET_ADDR_2 = '18.222.29.148:9944';
export const EDGEWARE_TESTNET_ADDR_3 = '18.223.143.102:9944';


program
  .version('0.1.0')
  .option('-w, --watch', 'Watch')
  .option('-p, --process', 'Process')
  .option('-g, --gist', 'Create a gist')
  .parse(process.argv);

if (program.watch) watcher.pollInIntervals(LOCALHOST);
if (program.process) processor.poll(LOCALHOST);
if (program.gist) github.createGist({
	identityType: 'github',
	identity: 'drewstone',
	sender: '5ERmnP13Gx8ybq64pi2LEGWVqF2AoRCM83UovE9537uRvLA8',
});
