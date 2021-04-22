/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import * as open from 'open';

import { Command, Flags } from '@oclif/core';
import { AuthFields, AuthInfo, Logger, Messages, OAuth2Options, SfdxError, WebOAuthServer } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'login');

export default class Login extends Command {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);
  public static flags = {
    'login-url': Flags.string({
      char: 'r',
      description: messages.getMessage('loginUrl'),
    }),
  };

  public async run(): Promise<AuthFields> {
    const { flags } = await this.parse(Login);
    const oauthConfig: OAuth2Options = { loginUrl: flags['login-url'] };

    try {
      const authInfo = await this.executeLoginFlow(oauthConfig);
      const fields = authInfo.getFields(true);
      const successMsg = messages.getMessage('success', [fields.username, fields.orgId]);
      this.log(successMsg);
      return fields;
    } catch (err) {
      const error = err as Error;
      Logger.childFromRoot('auth').debug(error);
      if (error.name === 'AuthCodeExchangeError') {
        throw new SfdxError(messages.getMessage('invalidClientId', [error.message]));
      }
      throw error;
    }
  }

  private async executeLoginFlow(oauthConfig: OAuth2Options): Promise<AuthInfo> {
    const oauthServer = await WebOAuthServer.create({ oauthConfig });
    await oauthServer.start();
    await open(oauthServer.getAuthorizationUrl(), { wait: false });
    return oauthServer.authorizeAndSave();
  }
}
