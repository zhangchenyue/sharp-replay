import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { Agent } from 'https';
import logger from '../common/logger';
import singleton from '../common/singleton';
import { CONSUL_URI, ENV } from '../common/constant';

const env = process.env.env || ENV;
const consulUri = process.env.consulUri || CONSUL_URI;
const retries = process.env.retries ? +process.env.retries : 3;
const timeout = process.env.consulTimeout ? +process.env.consulTimeout : 5 * 1000;

let axiosClient: AxiosInstance;

export const initialize = async () => {
  axiosClient = axios.create({
    baseURL: consulUri,
    httpsAgent: new Agent({ rejectUnauthorized: false, keepAlive: true }),
    timeout
  });
  axiosRetry(axiosClient, { retries });

  logger.info(`Initialized Consul, env="${env}" uri="${consulUri}"`);
};

export const query = async (key: string) => {
  try {
    const { data } = await axiosClient.get<Array<{ Value: string }>>(`/v1/kv/${env}/${key}`);
    const value = Buffer.from(data[0].Value, 'base64').toString('utf-8');

    logger.info(`Got Consul key="${key}" value="${value}"`);
    return { value };
  } catch (err) {
    logger.warn(`Failed to get Consul key="${key}" ${err}`);
    return { value: null };
    // FIXME: cannot be catched by upper function, should because of singleton
  }
};

/**
 * get Consul configuration.
 * @param key configuration key.
 * @param app Application of this configuration belongs to. "portal" by default.
 */
const consul = singleton(query, initialize) as (key: string, app?: string) => Promise<string>;

export default consul;
