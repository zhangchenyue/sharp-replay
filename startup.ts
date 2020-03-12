#!/usr/bin/env node

import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import commander from 'commander';
import fs from 'fs';
import logSymbols from 'log-symbols';
import path from 'path';

import * as pkg from './package.json';
import logger from './common/logger';
import {
  createWellAsync,
  fetchWellByIdAsync,
  deleteWellAsync,
  deleteAllNodeToolCreatedWellAsync,
} from './services/well.service';
import { createJobSetupAsync } from './services/job-setup.service';
import { streamingByCsvFileAsync } from './services/channel.service';
import { DeviceProvider } from './providers/device.provider';

// For fiddler hook
// process.env.https_proxy = 'http://127.0.0.1:8888';
// process.env.http_proxy = 'http://127.0.0.1:8888';
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import semver from 'semver';
import { engines } from './package.json';

const version = engines.node;

if (!semver.satisfies(process.version, version)) {
  console.error(
    logSymbols.error,
    chalk.redBright(`Your node version ${process.version} not satisfied with required node version ${version}  `)
  );
  process.exit(0);
}

const defaultDataSource = path.join(__dirname, './config/datasource.csv');
let isCleaning = false;

const init = async (wid?: string, jId?: string) => {
  if (wid && jId) {
    return { wellId: wid, jobId: jId };
  }
  let isExistWell = false;
  if (wid) {
    isExistWell = !!(await fetchWellByIdAsync(wid));
    isExistWell && console.log('\n', chalk.cyan(logSymbols.info, `Well ${wid} already exist`));
  }

  if (!isExistWell) {
    if (wid) {
      console.log('\n', chalk.cyan(logSymbols.info, `Well ${wid} not exist`));
    }
    console.log('\n', chalk.bgCyan(`Well creating`));
    const well = await createWellAsync(wid);
    wid = well.id;
    console.log(logSymbols.success, chalk.greenBright(`Well ${well.name} created successuflly!`));
    logger.info(`well created`, well.id, well.name);
  }

  logger.info(`Start to upload Job setup`);
  console.log('\n', chalk.bgCyan(`Job setup`));
  const resp = await createJobSetupAsync(wid);
  console.log(logSymbols.success, chalk.greenBright(`Job ${resp.jobId} created successuflly!`));
  return {
    wellId: wid,
    jobId: resp.jobId,
  };
};

const main = async () => {
  const dataFilePath = typeof commander.path === 'string' ? commander.path : defaultDataSource;
  let { well, job } = commander;
  if (!well || !job) {
    const { wellId, jobId } = await init(well, job);
    well = wellId;
    job = jobId;
  }
  const device = new DeviceProvider();
  await device.registerDeviceAsync(well);
  curDevice = device;
  await streamingByCsvFileAsync(device, well, job, '', dataFilePath);
};

let curDevice: DeviceProvider = null;
if (process.platform === 'win32') {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  rl.on('SIGINT', () => process.emit('SIGINT' as any));
}
process.on('SIGINT', async () => {
  // graceful shutdown
  if (curDevice !== null) {
    if (isCleaning) {
      return;
    }
    isCleaning = true;
    console.log(chalk.bgCyan(`Cleanning`));
    logger.info(`Program exit, do clean`);
    logger.info(`Start to upload Job setup`);
    await curDevice.closeEtpSessionAsync();
    await curDevice.deleteDeviceAsync();
    isCleaning = false;
    process.exit(0);
  } else {
    process.exit(0);
  }
});

const startup = async () => {
  try {
    commander
      .name('sprt')
      .version(pkg.version, '-v, --version', 'output the current version')
      .description('A simulator for sending channel data to prism')
      .option('-p, --path <filepath>', 'Specify the channel data csv file path')
      .option('-w, --well <wellId>', 'Specify the well id to send')
      .option('-j, --job <jobId>', 'Specify the job id')
      .option('-i, --interval', 'Set channel time index interval, default: 1 second')
      .option('-r, --rows', 'Set row count per sending message, default: 1')
      .option('-d, --delete <wellId>', 'Delete a well by id')
      .option('-c, --clean <wellName>', 'Clean wells by keykwords of well name, e.g "NodeJ" ')
      .parse(process.argv);

    if (typeof commander.path === 'string') {
      if (!fs.existsSync(commander.path)) {
        console.log('\n', chalk.redBright(`Error, ${commander.path} not exist!`));
      }
    }

    if (typeof commander.delete === 'string') {
      console.log('\n', chalk.bgCyan(`Delete well by id ${commander.delete}`));
      await deleteWellAsync(commander.delete);
      process.exit(0);
    }

    if (typeof commander.clean === 'string') {
      if (commander.clean.length < 6) {
        console.log(logSymbols.error, chalk.red(`The keyword must more than 6 charactors!`));
        process.exit(0);
      }
      console.log('\n', chalk.bgCyan(`Clean wells like ${commander.clean}`));
      await deleteAllNodeToolCreatedWellAsync(commander.clean);
      process.exit(0);
    }

    clear();
    console.log(chalk.yellowBright(figlet.textSync('sharp-replay', { horizontalLayout: 'full' })));
    commander.outputHelp();

    logger.info(`Replay tool starting`);
    console.log('\n', chalk.bgCyan(`Replay tool starting`));
    await main();
  } catch (error) {
    console.log('\n', chalk.red(error));
  }
};

startup();
