/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as open from 'open';

import { Command, Flags } from '@oclif/core';
import {
  AuthFields,
  AuthInfo,
  AuthRemover,
  Messages,
  OAuth2Options,
  SfdxError,
  WebOAuthServer,
} from '@salesforce/core';
import { getString } from '@salesforce/ts-types';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-login', 'login.org', [
  'alias',
  'clientId',
  'description',
  'examples',
  'invalidClientId',
  'jwtFile',
  'jwtUser',
  'loginUrl',
  'success',
]);

// eslint-disable-next-line no-shadow
export enum LoginMethod {
  ORG_WEB = 'org_web',
  ORG_JWT = 'org_jwt',
}

export default class LoginOrg extends Command {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {
    alias: Flags.string({
      char: 'a',
      description: messages.getMessage('alias'),
    }),
    'login-url': Flags.string({
      char: 'r',
      description: messages.getMessage('loginUrl'),
      default: 'https://login.salesforce.com',
    }),
    'jwt-file': Flags.string({
      char: 'f',
      description: messages.getMessage('jwtFile'),
      dependsOn: ['jwt-user', 'client-id'],
    }),
    'jwt-user': Flags.string({
      char: 'u',
      description: messages.getMessage('jwtUser'),
      dependsOn: ['jwt-file', 'client-id'],
    }),
    'client-id': Flags.string({
      char: 'i',
      description: messages.getMessage('clientId'),
    }),
  };

  public flags: {
    alias: string;
    'client-id': string;
    'login-url': string;
    'jwt-file': string;
    'jwt-user': string;
  };

  public async run(): Promise<AuthFields> {
    this.flags = (await this.parse(LoginOrg)).flags;

    const method = this.determineConnectMethod();
    let authInfo: AuthInfo;
    switch (method) {
      case LoginMethod.ORG_JWT:
        authInfo = await this.executeJwtOrgFlow();
        break;
      case LoginMethod.ORG_WEB:
        authInfo = await this.executeWebLoginOrgFlow();
        break;
      default:
        break;
    }
    await this.handleSideEffects(authInfo);
    const fields = authInfo.getFields(true);
    const successMsg = `Successfully authorized ${fields.username} with ID ${fields.orgId}`;
    this.log(successMsg);
    return fields;
  }

  private determineConnectMethod(): LoginMethod {
    if (this.flags['jwt-file'] && this.flags['jwt-user'] && this.flags['client-id']) return LoginMethod.ORG_JWT;
    else return LoginMethod.ORG_WEB;
  }

  private async handleSideEffects(authInfo: AuthInfo): Promise<void> {
    if (this.flags.alias) await authInfo.setAlias(this.flags.alias);
  }

  private async executeJwtOrgFlow(): Promise<AuthInfo> {
    this.log('Executing salesforce org JWT auth flow...');
    try {
      const oauth2OptionsBase = {
        clientId: this.flags['client-id'],
        privateKeyFile: this.flags['jwt-file'],
      };

      const loginUrl = this.flags['login-url'];

      const oauth2Options = loginUrl ? Object.assign(oauth2OptionsBase, { loginUrl }) : oauth2OptionsBase;

      let authInfo: AuthInfo;
      try {
        authInfo = await AuthInfo.create({ username: this.flags['jwt-user'], oauth2Options });
      } catch (error) {
        const err = error as SfdxError;
        if (err.name === 'AuthInfoOverwriteError') {
          this.debug('Auth file already exists. Removing and starting fresh.');
          const remover = await AuthRemover.create();
          await remover.removeAuth(this.flags['jwt-user']);
          authInfo = await AuthInfo.create({
            username: this.flags['jwt-user'],
            oauth2Options,
          });
        } else {
          throw err;
        }
      }
      await authInfo.save();
      return authInfo;
    } catch (err) {
      const msg = getString(err, 'message');
      const error = `We encountered a JSON web token error, which is likely not an issue with Salesforce CLI. Here’s the error: ${msg}`;
      throw new SfdxError(error, 'JwtGrantError');
    }
  }

  private async executeWebLoginOrgFlow(): Promise<AuthInfo> {
    this.log('Executing salesforce org web auth flow...');
    try {
      const oauthConfig: OAuth2Options = this.flags['login-url'] ? { loginUrl: this.flags['login-url'] } : {};
      const oauthServer = await WebOAuthServer.create({ oauthConfig });
      await oauthServer.start();
      await open(oauthServer.getAuthorizationUrl(), { wait: false });
      const authInfo = await oauthServer.authorizeAndSave();
      return authInfo;
    } catch (err) {
      const error = err as Error;
      this.debug(error);
      if (error.name === 'AuthCodeExchangeError') {
        const errMsg = `Invalid client credentials. Verify the OAuth client secret and ID. ${error.message}`;
        throw new SfdxError(errMsg, 'InvalidClientCredentials');
      }
      throw error;
    }
  }
}
