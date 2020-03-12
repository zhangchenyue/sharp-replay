import { AuthenticationContext, TokenResponse } from 'adal-node';
import * as azure from 'azure-keyvault';
interface IKeyVaultOptions {
  uri: string;
  clientId: string;
  clientSecret: string;
}

// don't export by azure-keyvault lib.
const KeyVaultCredentials = (azure as any).KeyVaultCredentials;

export default function azureKVClient(options: IKeyVaultOptions) {
  const authenticator = (challenge: any, callback: any) => {
    const context = new AuthenticationContext(challenge.authorization);
    return context.acquireTokenWithClientCredentials(
      challenge.resource,
      options.clientId,
      options.clientSecret,
      (err, response) => {
        if (err) {
          throw err;
        }
        const tokenResponse = response as TokenResponse;
        const authValue = `${tokenResponse.tokenType} ${tokenResponse.accessToken}`;
        return callback(null, authValue);
      }
    );
  };
  const credentials = new KeyVaultCredentials(authenticator);
  return new azure.KeyVaultClient(credentials, {
    // FIXME: double check if controls the timeout which is not retry.
    longRunningOperationRetryTimeout: 10,
    noRetryPolicy: true
  });
}
