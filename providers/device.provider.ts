import axios from 'axios';
import { Stream } from 'stream';
import { once } from 'events';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import logSymbols from 'log-symbols';

import { logger } from '../common';
import consul from '../core/consul';
import {
  buildEtpSessionMsg,
  buildEtpCloseSessionMsg,
  buildChannelMetaMsg,
  buildChannelDataMsg,
} from '../core/prism-msg';
import { IotClient } from '../core/iot-client';
import { getTokenAsync } from './token.provider';

export class DeviceProvider {
  iotClient: IotClient = null;
  currentSession: string = null;
  deviceId: string = null;
  wellId: string = null;

  constructor(iotClient?: IotClient) {
    this.iotClient = iotClient;
  }

  getCurrentSession() {
    return this.currentSession;
  }

  async registerDeviceAsync(wellId: string): Promise<any> {
    const deviceURL = await consul('Uri-Slb.Prism.Core.Service.Device-1');
    const token = await getTokenAsync();
    const { data } = await axios.post(
      `${deviceURL}`,
      {
        Id: uuidv4(),
        WellUuid: wellId,
        AcceptProtocol: '3.0.0.0',
        Name: '',
        Scope: '',
        MetaData: null,
        Overwrite: true, // one well one device
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { primaryConnectionString, id } = data;
    this.iotClient = new IotClient(primaryConnectionString);
    this.deviceId = id;
    this.wellId = wellId;
    return data;
  }

  async getDeviceBlobAsync(wellId: string): Promise<any> {
    const deviceURL = await consul('Uri-Slb.Prism.Core.Service.Device-1');
    const token = await getTokenAsync();
    const { data } = await axios.post(
      `${deviceURL}`,
      {
        Id: this.deviceId,
        WellUuid: wellId,
        AcceptProtocol: '3.0.0.0',
        Name: '',
        Scope: '',
        MetaData: null,
        Overwrite: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  }

  async openEtpSessionAsync(wellId?: string): Promise<string> {
    wellId = wellId || this.wellId;
    const messageId = uuidv4();
    const etpSessionBuffer: Buffer = buildEtpSessionMsg({ messageId, wellId });
    await this.iotClient?.sendMsgToAzureIotHub({ messageId, data: etpSessionBuffer });
    const [{ data }] = await once(this.iotClient, 'message');
    const sessionId = data.toString('utf8').slice(-37, -1);
    logger.info(`Open etp session, messageId=${messageId} wellId=${wellId} sessionId=${sessionId}`);
    this.currentSession = sessionId;
    return sessionId;
  }

  async closeEtpSessionAsync(): Promise<void> {
    if (this.currentSession === null) {
      return;
    }
    const messageId = uuidv4();
    const etpSessionBuffer: Buffer = buildEtpCloseSessionMsg({
      messageId,
      wellId: this.wellId,
      sessionId: this.currentSession,
    });
    await this.iotClient?.sendMsgToAzureIotHub({ messageId, data: etpSessionBuffer });
    if (this.currentSession) {
      console.log(logSymbols.success, chalk.greenBright(`Etp session ${this.getCurrentSession()} has been closed`));
      logger.info(`Close etp session, messageId=${messageId} wellId=${this.wellId} sessionId=${this.currentSession}`);
      this.currentSession = null;
    }
  }

  async sendPrismMessageAsync(content: any): Promise<any> {
    return await this.iotClient?.sendMsgToAzureIotHub(content);
  }

  async uploadBlobMessageAsync(contentStream: Stream, size: number): Promise<any> {
    return await this.iotClient?.uploadToAzureBlob(this.deviceId, contentStream, size);
  }

  async sendChannelMetaAsync({ wellId = '', jobId = '', logId = '', channels = [], units = [] }: any = {}) {
    const sessionId = this.currentSession;
    if (!sessionId) {
      console.error('Invalid Session, need open session first');
      return { messageId: '', wellId, jobId };
    }
    const messageId = uuidv4();
    const msgBuf: Buffer = buildChannelMetaMsg({ messageId, sessionId, wellId, jobId, logId, channels, units });
    await this.sendPrismMessageAsync({ messageId, containerId: wellId, contentType: 'application/json', data: msgBuf });
    return { messageId, wellId, jobId };
  }

  async sendChannelDataRowAsync({ wellId = '', jobId = '', rowData = [], startTime = Date.now() }: any = {}) {
    const sessionId = this.currentSession;
    if (!sessionId) {
      logger.error('Invalid Session, need open session first');
      return { messageId: '', wellId, jobId };
    }
    const channelDataBuf: Buffer = buildChannelDataMsg({ wellId, jobId, sessionId, channelData: rowData, startTime });
    const messageId = uuidv4();
    await this.sendPrismMessageAsync({ messageId, data: channelDataBuf });
    return { messageId, wellId, jobId };
  }

  async deleteDeviceAsync(): Promise<void> {
    const deviceURL = await consul('Uri-Slb.Prism.Core.Service.Device-1');
    const token = await getTokenAsync();
    try {
      await axios.delete(`${deviceURL}${this.deviceId}`, {
        headers: {
          'Ocp-Apim-Trace': 'true',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(logSymbols.success, chalk.greenBright(`Device ${this.deviceId} has been deleted`));
      logger.info(`Device ${this.deviceId} has been deleted`);
    } catch (error) {
      logger.error(`Fail to delete device: `, this.deviceId);
    }
  }
}
