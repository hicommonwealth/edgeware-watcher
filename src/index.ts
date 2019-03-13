require('dotenv').config();
import '@babel/polyfill';
import * as watcher from './watcher';
import * as processor from './process';
import * as github from './github';
import * as crypto from './crypto';
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
  .option('-d, --decrypt', 'Decrypt the Gist fixture')
  .parse(process.argv);

if (program.watch) watcher.pollInIntervals(LOCALHOST);
if (program.process) processor.poll(LOCALHOST);
if (program.gist) github.createGist({
	identityType: 'github',
	identity: 'drewstone',
	sender: '5ERmnP13Gx8ybq64pi2LEGWVqF2AoRCM83UovE9537uRvLA8',
});
if (program.decrypt) console.log(crypto.decrypt('U2FsdGVkX18w/qKRmbPHBBNgomsjofjxG5iTZj8/Ui5wXOzSYmk7J355c/mxtaoBomIBuzoffTG3gkOK7vVF+Ro0DiJAiJdL+qth1d6e8nsJnBXbucfyZpB65QRg2/NZaZBl1x3vz44ZVX2IxaqEkAViHFbT8ebdsAUKl5DvkeA77OSxPPe4CZxwckAj9b3DsT7zr1GPFVMVXOB7FN2W9h2MKE9mRxA7QOI4KDS4sM8bDHizGU4tPn0DknqtmIVS8L6zVEN15sm9x2aewe2RoxI7pmPp/RSK50aszTGFvvA='));
