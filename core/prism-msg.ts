import * as avro from 'avro-js';
import { v4 as uuidv4 } from 'uuid';
import {
  PRISM_MSG_HEADER,
  ETP_MSG_HEADER,
  JOBSETUP_SCHEMA,
  CHANNEL_META,
  CHANNEL_DATA,
  ETP_MSG_SESSION,
  ETP_MSG_CLOSE_SESSION,
  CHANNEL_DATA_CHANGE,
} from '../avro-schema';

enum ChannelIndexTypes {
  Time = 'Time',
  Depth = 'Depth',
  ElapsedTime = 'ElapsedTime',
}

enum IndexDirections {
  Increasing = 'Increasing',
  Decreasing = 'Decreasing',
}

enum ChannelStatuses {
  Active = 'Active',
  Inactive = 'Inactive',
  Closed = 'Closed',
}

export function guidToBytes(guid: string) {
  const bytes: Array<any> = [];
  guid.split('-').map((num: string, index) => {
    const bytesInChar = index < 3 ? num.match(/.{1,2}/g).reverse() : num.match(/.{1,2}/g);
    bytesInChar.map((byte) => {
      bytes.push(parseInt(byte, 16));
    });
  });
  return bytes;
}

export function buildPrismHeaderBuffer(data: any): Buffer {
  const prismHeader = {
    version: { major: 3, minor: 0, revision: 0, patch: 0 },
    messageId: Buffer.from(guidToBytes(data.messageId || uuidv4())),
    sessionId: Buffer.from(guidToBytes(data.sessionId || uuidv4())),
    containerId: data.containerId || data.wellId,
    source: data.source || 'nodejs replay tool',
    contentType: data.contentType || 'application/json',
  };
  return avro.parse(PRISM_MSG_HEADER).toBuffer(prismHeader);
}

export function buildEtpMessageHeaderBuffer(data: any): Buffer {
  const EtpMessageHeader = {
    protocol: typeof data.protocol === 'undefined' ? 1 : data.protocol,
    messageType: data.messageType || 2,
    correlationId: data.correlationId || 3,
    messageId: 1000,
    messageFlags: data.messageFlags || 0,
  };
  return avro.parse(ETP_MSG_HEADER).toBuffer(EtpMessageHeader);
}

export function buildJobSetupMsg(data: any = {}): Buffer {
  const prismHeaderBuffer = buildPrismHeaderBuffer(data);
  const jobSetupMsgBodyBuffer = avro.parse(JOBSETUP_SCHEMA).toBuffer({ Content: data.content });
  return Buffer.concat([prismHeaderBuffer, jobSetupMsgBodyBuffer]);
}

export function buildChannelMetaMsg(data: any = {}): Buffer {
  const { wellId, jobId, logId, channels, units } = data;
  const prismHeaderBuffer = buildPrismHeaderBuffer({
    ...data,
    containerId: jobId,
    contentType: 'application/x-etp;version=2.0;type=channelmetadata',
  });
  const etpHeaderBuffer = buildEtpMessageHeaderBuffer(data);

  // take first channel as index channel
  const indexes: any = [
    {
      indexType: ChannelIndexTypes.Time,
      uom: units[0],
      datum: { string: '' },
      direction: IndexDirections.Increasing,
      mnemonic: { string: channels[0] },
      description: { string: '' },
      uri: { string: `eml://PrismSimulator.slb.com/${wellId}/${jobId}/${logId}/` },
      customData: { item: { item: { string: '' } } },
    },
  ];

  const channelMeta: any = { channels: [] };
  channels.forEach((channelName: string, i: number) => {
    let channelDataType = 'string';
    if (i === 0) channelDataType = 'float';
    if (channelName.includes('IMAGE')) channelDataType = 'Energistics.Datatypes.ArrayOfDouble';
    const channel: any = {
      channelUri: `eml://PrismSimulator.slb.com/${wellId}/${jobId}/${logId}/${channelName}`,
      channelId: i,
      indexes,
      mnemonic: channelName,
      dataType: channelDataType,
      uom: units[i],
      startIndex: { 'Energistics.Datatypes.ChannelData.IndexValue': { item: { double: 0.0 } } },
      endIndex: { 'Energistics.Datatypes.ChannelData.IndexValue': { item: { double: 0.0 } } },
      description: channelName,
      status: ChannelStatuses.Active,
      objectMetadata: null,
      source: '',
      measureClass: '',
    };
    channelMeta.channels.push(channel);
  });
  const channelMetaBuffer = avro.parse(CHANNEL_META).toBuffer(channelMeta);
  return Buffer.concat([prismHeaderBuffer, etpHeaderBuffer, channelMetaBuffer]);
}

export function buildChannelDataMsg(data: any = {}): Buffer {
  const { jobId, sessionId, channelData, startTime } = data;

  const prismHeaderBuffer = buildPrismHeaderBuffer({
    sessionId,
    containerId: jobId,
    contentType: 'application/x-etp;version=2.0;type=channeldata',
  });
  const etpHeaderBuffer = buildEtpMessageHeaderBuffer({ messageType: 3 });
  const channels: Array<any> = [];
  channelData.forEach((item: any, idx: number) => {
    if (item !== '#N/A') {
      const dataItem: any = {
        channelId: idx,
        indexes: [
          {
            item: {
              'Energistics.Datatypes.DateTime': {
                time: startTime,
                offset: 0.0,
              },
            },
          },
        ],
        value: {
          item: { double: parseFloat(item) },
        },
        valueAttributes: [],
      };

      channels.push(dataItem);
    }
  });
  const channelDataBuffer = avro.parse(CHANNEL_DATA).toBuffer({ data: channels });
  return Buffer.concat([prismHeaderBuffer, etpHeaderBuffer, channelDataBuffer]);
}

export function buildChannelDataChangeMsg(data: any = {}): Buffer {
  const { jobId, channelId, sessionId, channelValues, startTime, endTime } = data;

  const prismHeaderBuffer = buildPrismHeaderBuffer({
    sessionId,
    containerId: jobId,
    contentType: 'application/x-etp;version=1.0;type=ChannelDataChange',
  });
  const etpHeaderBuffer = buildEtpMessageHeaderBuffer({ messageType: 6 });
  const channelData: Array<any> = [];
  channelValues.forEach((item: any, idx: number) => {
    if (item !== '#N/A') {
      const dataItem: any = {
        channelId,
        indexes: [
          {
            item: {
              'Energistics.Datatypes.DateTime': {
                time: startTime + idx * 1000,
                offset: 0.0,
              },
            },
          },
        ],
        value: {
          item: { double: parseFloat(item) },
        },
        valueAttributes: [],
      };

      channelData.push(dataItem);
    }
  });
  const channelDataBuffer = avro.parse(CHANNEL_DATA_CHANGE).toBuffer({
    channelId,
    startIndex: {
      item: {
        'Energistics.Datatypes.DateTime': {
          time: startTime,
          offset: 0.0,
        },
      },
    },
    endIndex: {
      item: {
        'Energistics.Datatypes.DateTime': {
          time: endTime,
          offset: 0.0,
        },
      },
    },
    data: channelData,
  });
  return Buffer.concat([prismHeaderBuffer, etpHeaderBuffer, channelDataBuffer]);
}

export function buildEtpSessionMsg(data: any = {}) {
  data = {
    ...data,
    source: '"Helios ReplayTool NodeJs Console Project',
    contentType: 'application/x-etp;version=1.0;type=Session',
  };

  const prismHeaderBuffer = buildPrismHeaderBuffer(data);
  const etpHeaderBuffer = buildEtpMessageHeaderBuffer({ protocol: 0, messageType: 1 });
  const etpSessionBuffer = avro.parse(ETP_MSG_SESSION).toBuffer({ applicationName: '', requestedProtocols: [] });
  return Buffer.concat([prismHeaderBuffer, etpHeaderBuffer, etpSessionBuffer]);
}

export function buildEtpCloseSessionMsg(data: any = {}) {
  data = {
    ...data,
    source: '"Helios ReplayTool NodeJs Console Project',
    contentType: 'application/x-etp;version=1.0;type=Session',
  };

  const prismHeaderBuffer = buildPrismHeaderBuffer(data);
  const etpHeaderBuffer = buildEtpMessageHeaderBuffer({ protocol: 0, messageType: 5 });
  const etpSessionBuffer = avro.parse(ETP_MSG_CLOSE_SESSION).toBuffer({ reason: { string: `close session` } });
  return Buffer.concat([prismHeaderBuffer, etpHeaderBuffer, etpSessionBuffer]);
}
