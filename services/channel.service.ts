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

import { getFileLines, sleep } from '../common';
import { buildChannelMetaMsg, buildChannelDataMsg } from '../core/prism-msg';
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

export async function recomputeAsync(filePath: string) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let lineNum = 0;
  const lu = require('log-update');
  for await (const line of rl) {
    await sleep(1000);
    lu(lineNum + '');
    lineNum++;
  }
}
