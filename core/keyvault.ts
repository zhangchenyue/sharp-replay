import KeyVaultClient from 'azure-keyvault';

import logger from '../common/logger';
import singleton from '../common/singleton';
import azureKVClient from './azure-kv';
import consul from './consul';
import { ENV } from '../common/constant';

const env = process.env.targetEnv || ENV;

let uri: string;
let clientId: string;
let clientSecret: string;
let azureClient: KeyVaultClient;

const initialize = async () => {
  try {
    [uri, clientId, clientSecret] = await Promise.all([
      consul('KeyVault-Uri'),
      consul('KeyVault-ClientId'),
      consul('KeyVault-ClientSecret'),
    ]);
    azureClient = azureKVClient({ uri, clientId, clientSecret });
    logger.info(`Initialized KeyVault, clientId="${clientId}" clientSecret="${clientSecret}"`);
  } catch (err) {
    logger.error(`Failed to initialize KeyVault. ${err}`);
    throw err;
  }
};

const query = async (key: string) => {
  try {
    const value = (await azureClient.getSecret(uri, `${env}-${key}`, '')).value;

    if (value === undefined) {
      throw new Error('undefined value');
    }
    logger.info(`Got KeyVault key="${key}" value="${value}"`);
    return { value };
  } catch (err) {
    logger.warn(`Failed to get KeyVault key="${key}" ${err}`);
    throw err;
  }
};

/**
 * get KeyVault configuration.
 * @param key configuration key.
 * @param app Application of this configuration belongs to. "portal" by default.
 */
const keyvault = singleton(query, initialize) as (key: string, app?: string) => Promise<string>;

export default keyvault;
