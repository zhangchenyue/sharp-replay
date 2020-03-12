import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { MultiStream } from '../core/muti-stream';
import { buildJobSetupMsg } from '../core/prism-msg';
import { DeviceProvider } from '../providers/device.provider';

let jobSetupJson: any = fs.readFileSync(path.join(__dirname, '../config/job.json'), 'utf8');

const eventBlobKey = 'event-blob-reference';

export async function createJobSetupAsync(wellId: string): Promise<any> {
  const jobId = uuidv4();
  const jobName = `W-Test-NodeJ_${new Date(Date.now()).toISOString()}`;
  jobSetupJson = jobSetupJson.replace(/{jobId}/g, jobId).replace(/{jobName}/g, jobName);
  const msgBuf: Buffer = buildJobSetupMsg({
    messageId: uuidv4(),
    sessionId: uuidv4(),
    containerId: wellId,
    source: 'node replaytool',
    contentType: 'application/json;version=1.0;type=HeliosEvent;msgType=JobSetup',
    content: jobSetupJson,
  });
  const device = new DeviceProvider();
  await device.registerDeviceAsync(wellId);
  const { msgId, blobName }: any = await device.uploadBlobMessageAsync(new MultiStream(msgBuf), msgBuf.byteLength);
  await device.sendPrismMessageAsync({
    messageId: msgId,
    [eventBlobKey]: blobName,
    ContainerId: wellId,
    contentType: 'application/json',
    DataObjectType: 'HeliosEvent;msgType=JobSetup',
    Version: '1.0',
    data: [],
  });
  return { msgId, wellId, jobId, jobName, eventBlobKey: blobName };
}
