import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ora from 'ora';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import logUpdate from 'log-update';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { getFileLines, sleep, getRandomInt } from '../common';
import { buildChannelMetaMsg, buildChannelDataMsg, buildChannelDataChangeMsg } from '../core/prism-msg';
import { DeviceProvider } from '../providers/device.provider';

dayjs.extend(utc);

export async function sendChannelMetaAsync(
  deviceProvider: DeviceProvider,
  { wellId = '', jobId = '', logId = '', channels = [], units = [] }: any = {}
) {
  const sessionId = deviceProvider.getCurrentSession();
  const messageId = uuidv4();
  const msgBuf: Buffer = buildChannelMetaMsg({
    messageId,
    sessionId,
    wellId,
    jobId,
    logId,
    channels,
    units,
  });
  await deviceProvider.sendPrismMessageAsync({
    messageId,
    containerId: wellId,
    contentType: 'application/json',
    data: msgBuf,
  });
  return { messageId, wellId, jobId };
}

export async function sendChannelDataRowAsync(
  deviceProvider: DeviceProvider,
  { wellId = '', jobId = '', rowData = [], startTime = Date.now() }: any = {}
) {
  const sessionId = deviceProvider.getCurrentSession();
  if (!sessionId) {
    return { messageId: '', wellId, jobId };
  }
  const channelDataBuf: Buffer = buildChannelDataMsg({ wellId, jobId, sessionId, rowData, startTime });
  const messageId = uuidv4();
  await deviceProvider.sendPrismMessageAsync({ messageId, data: channelDataBuf });
  return { messageId, wellId, jobId };
}

export async function streamingByCsvFileAsync(
  deviceProvider: DeviceProvider,
  wellId: string,
  jobId: string,
  logId: string,
  filePath: string,
  interval: number = 1000,
  round: number = 1
) {
  const totalRowCount = await getFileLines(filePath);
  const totalDataRowCount = totalRowCount - 2;
  const sessionId = deviceProvider.getCurrentSession() || (await deviceProvider.openEtpSessionAsync(wellId));
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let lineNum = 0;
  let startTime = Date.now();
  let channels: string[] = [];
  let units: string[] = [];

  for await (const line of rl) {
    const rowData = line.split(',');
    const spinner = ora();
    if (lineNum === 0) {
      channels = rowData;
    } else if (lineNum === 1) {
      units = rowData;
      if (round === 1) {
        console.log('\n', chalk.bgCyan(`Sending channel meta data`));
        const { messageId } = await deviceProvider.sendChannelMetaAsync({ wellId, jobId, logId, channels, units });
        console.log(
          logSymbols.success,
          chalk.greenBright(`Channel meta data send successuflly! ${chalk.magenta(channels.length)} channels`),
          `Meta data messageId: ${chalk.cyanBright(messageId)}`
        );
        console.log('\n', chalk.bgCyan(`Info`));
        console.log(logSymbols.info, 'WellId: ', chalk.cyanBright(wellId));
        console.log(logSymbols.info, 'JobId: ', chalk.cyanBright(jobId));
        console.log(logSymbols.info, 'SessionId: ', chalk.cyanBright(sessionId));
        console.log(logSymbols.info, 'Datafile:', chalk.cyanBright(`${path.resolve(filePath)}`));
        console.log(logSymbols.info, 'Index Interval:', chalk.cyanBright(`${interval / 1000} sec`));
        console.log(logSymbols.info, 'Row count per message:', chalk.cyanBright(`1`));
        console.log('\n', chalk.bgCyan('Start streaming'));
      }
    } else {
      if (lineNum > 2 && (lineNum - 2) % 60 === 0) {
        console.log(chalk.bgCyan('Recomputing ...'));
        const num = await autoRecomputeAsync(
          deviceProvider,
          wellId,
          jobId,
          sessionId,
          filePath,
          round,
          totalDataRowCount,
          lineNum,
          startTime
        );
        console.log(chalk.bgCyan(`End recompute, total recompute ${num} channels\n`));
        console.log('continue realtime');
      }

      const resChannel = await deviceProvider.sendChannelDataRowAsync({ wellId, jobId, rowData, startTime });
      await sleep(interval);

      if (deviceProvider.getCurrentSession()) {
        const loadingIcon = chalk.gray.dim(spinner.frame());
        const output = `${loadingIcon}${chalk.cyan('Round: ')}${chalk.yellow(round)}${chalk.cyan(
          ', Total data rows: '
        )}${chalk.yellow(totalDataRowCount)}${chalk.cyan(', Current data row: ')}${chalk.yellow(
          lineNum - 1
        )}\nTimeIndex: ${chalk.green(dayjs(startTime).format())}, MessageId: ${chalk.green(resChannel.messageId)}`;
        logUpdate(output);
      }
    }
    startTime += 1000;
    lineNum++;
  }
  await streamingByCsvFileAsync(deviceProvider, wellId, jobId, logId, filePath, interval, ++round);
  console.log(logSymbols.success, 'send all data complete');
  await deviceProvider.closeEtpSessionAsync();
  await deviceProvider.deleteDeviceAsync();
}

export async function autoRecomputeAsync(
  deviceProvider: DeviceProvider,
  wellId: string,
  jobId: string,
  sessionId: string,
  filePath: string,
  round: number,
  dataCount: number,
  lineNum: number,
  startTime: number
) {
  const dataStart = startTime - ((round - 1) * dataCount + lineNum) * 1000;
  const totalRoundItems = round === 1 ? lineNum : dataCount;
  const splitCount = 3;
  const chunkItemsCount = Math.floor(totalRoundItems / splitCount);
  const randomRound = round === 1 ? 1 : getRandomInt(1, round - 1);
  const randomChunk = getRandomInt(1, splitCount - 1);
  const randomRoundStart = dataStart + (randomRound - 1) * dataCount * 1000;
  const recomputeStart = randomRoundStart + (randomChunk - 1) * chunkItemsCount * 1000;
  const recomputeEnd = recomputeStart + 1000 * (chunkItemsCount - 1);
  const recomputeDataStartIndex = (randomChunk - 1) * chunkItemsCount;
  const recomputeDataEndIndex = recomputeDataStartIndex + chunkItemsCount - 1;
  console.log('Range:', new Date(recomputeStart), ' -- ', new Date(recomputeEnd));
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let lineNum2 = 0;
  const recomputeLines: Array<any> = [];
  let totalChannels: Array<string> = [];

  const recomputeChannelMnemonic = getComputedChannels().map((ch: any) => ch.Mnemonic);

  for await (const line of rl) {
    if (lineNum2 === 0) {
      totalChannels = line.split(',');
    }
    const idx = lineNum2 - 2;
    if (idx >= recomputeDataStartIndex && idx <= recomputeDataEndIndex) {
      recomputeLines.push(line);
    }
    lineNum2++;
  }
  const recomputeChannels = recomputeChannelMnemonic
    .filter((mnemonic) => totalChannels.includes(mnemonic))
    .map((name: string) => {
      const channelId = totalChannels.indexOf(name);
      const channelValues = recomputeLines.map((l) => l.split(',')[channelId]);
      return { wellId, jobId, sessionId, channelId, channelValues, startTime: recomputeStart, endTime: recomputeEnd };
    });

  const eraseChannelsMessages = recomputeChannels.map((values: any) => {
    const d = {
      ...values,
      channelValues: [],
    };
    const channelDataBuf: Buffer = buildChannelDataChangeMsg({ ...d });
    const messageId = uuidv4();
    return deviceProvider.sendPrismMessageAsync({ messageId, data: channelDataBuf });
  });

  for await (const e of eraseChannelsMessages) {
  }

  await sleep(15000);

  const recomputeChannelsMessages = recomputeChannels.map((values: any) => {
    const channelDataBuf: Buffer = buildChannelDataChangeMsg({ ...values });
    const messageId = uuidv4();
    return deviceProvider.sendPrismMessageAsync({ messageId, data: channelDataBuf });
  });
  for await (const c of recomputeChannelsMessages) {
  }

  return recomputeChannels.length;
}

export function getComputedChannels(jobSetupPath: string = '') {
  if (!jobSetupPath) {
    jobSetupPath = path.join(__dirname, '../config/job.json');
  }
  const jobSetup = require(jobSetupPath);
  const computeChannels: Array<string> = [];
  jobSetup.EquipmentList.forEach((equipment: any) => {
    const queue: Array<any> = [equipment];
    while (queue.length) {
      const { Channels = [], Parts = [] } = queue.shift();
      Channels.forEach((channel: any) => {
        if (channel.ChannelType === 1) {
          computeChannels.push(channel);
        }
      });
      queue.push(...Parts);
    }
  });
  return computeChannels;
}
