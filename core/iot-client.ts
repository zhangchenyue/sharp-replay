import { Stream } from 'stream';
import { EventEmitter } from 'events';
import { Client, Message } from 'azure-iot-device';
import { Amqp as Protocol } from 'azure-iot-device-amqp';
import { v4 as uuidv4 } from 'uuid';

import logger from '../common/logger';

const BLOB_PREFIX = 'event-blob-';

export class IotClient extends EventEmitter {
  private _client: Client = null;

  constructor(connectionString: string) {
    super();
    this._client = Client.fromConnectionString(connectionString, Protocol);
    this._client.on('message', (msg: any) => {
      this.emit('message', msg);
    });
  }

  uploadToAzureBlob(deviceId: string, contentStream: Stream, size: number): Promise<any> {
    const blobMsgId = uuidv4();
    const blobFileName = `${BLOB_PREFIX}${blobMsgId}`;

    return new Promise((resolve, reject) => {
      this._client.uploadToBlob(blobFileName, contentStream, size, (err: any) => {
        if (err) {
          logger.info(`Error uploading file, "${err.constructor.name}" err="${err.message}"`);
          reject(err);
        } else {
          logger.info('Upload successful - ' + `${deviceId}/${blobFileName}`);
          resolve({
            msgId: blobMsgId,
            deviceId,
            blobName: blobFileName,
          });
        }
      });
    });
  }

  sendMsgToAzureIotHub(content: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const { data = [] } = content;
      const message = new Message(data);

      Object.keys(content)
        .filter((key) => key !== 'data')
        .forEach((k: any) => {
          message.properties.add(k, content[k]);
        });
      message.messageId = content.messageId || uuidv4();
      message.contentType = content.contentType || 'application/json';
      this._client.sendEvent(message, (err, result) => {
        if (err) {
          reject(err);
          logger.info('Fail to Send message ', err);
        } else {
          resolve(result);
        }
      });
    });
  }
}
