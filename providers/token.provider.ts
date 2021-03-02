import axios from 'axios';
import NodeCache from 'node-cache';
import querystring from 'querystring';

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

    const tokenServiceUrl = (await consul('SAuth-V2-Token-Service-Url')).replace(/\/$/, '');
    const sauthClientId = await consul('SAuth-ServiceId-Helios-ProvisionAgent');
    const sauthClientSecret = await keyvault('SAuth-Secret-Helios-ProvisionAgent');

    const base64 = Buffer.from(`${sauthClientId}:${sauthClientSecret}`).toString('base64');
    const basicAuthToken = `Basic ${base64}`;

    const body = querystring.stringify({
      grant_type: 'client_credentials',
    });
    const {
      data: { access_token },
    } = await axios.post(`${tokenServiceUrl}/token`, body, {
      headers: {
        authorization: basicAuthToken,
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    memoryCache.set(TOKEN_CACHE_KEY, access_token, TOKEN_TTL);
    logger.info(`get token, "${access_token}"`);
    return access_token;
  } catch (err) {
    logger.error(`Failed to get token. ERR "${err.message}"`);
    throw new Error(`Failed to get token. ERR "${err.message}"`);
  }
}
