import axios from 'axios';
import NodeCache from 'node-cache';

import logger from '../common/logger';
import consul from '../core/consul';
import keyvault from '../core/keyvault';

const TOKEN_TTL: number = 30 * 60; // seconds
const memoryCache = new NodeCache();
const TOKEN_CACHE_KEY = '_svctoken';

export async function getTokenAsync() {
  try {
    const t = memoryCache.get(TOKEN_CACHE_KEY);
    if (t) {
      return Promise.resolve(t);
    }
    const [tokenUrl, apiKey, projectid, serviceid, secret] = await Promise.all([
      consul('SAuth-ServiceToken-Uri'),
      keyvault('SAuth-ServiceToken-ApiKey'),
      consul('SAuth-ProjectId-Helios'),
      consul('SAuth-ServiceId-Helios-ProvisionAgent'),
      keyvault('SAuth-Secret-Helios-ProvisionAgent'),
    ]);
    const {
      data: { svctoken },
    } = await axios.post(`${tokenUrl}?key=${apiKey}`, {
      projectid,
      serviceid,
      secret,
    });

    memoryCache.set(TOKEN_CACHE_KEY, svctoken, TOKEN_TTL);
    logger.info(`get token, "${svctoken}"`);
    return svctoken;
  } catch (err) {
    logger.error(`Failed to get token. ERR "${err.message}"`);
    throw new Error(`Failed to get token. ERR "${err.message}"`);
  }
}
