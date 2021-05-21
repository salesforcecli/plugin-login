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
  'audienceUrl',
  'browser',
  'clientId',
  'description',
  'examples',
  'instanceUrl',
  'invalidClientId',
  'jwtFile',
  'jwtUser',
  'setDefault',
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
      description: messages.getMessage('alias'),
      char: 'a',
      helpValue: '<value>',
    }),
    'audience-url': Flags.string({
      description: messages.getMessage('audienceUrl'),
      helpValue: '<value>',
    }),
    browser: Flags.string({
      description: messages.getMessage('browser'),
      char: 'b',
      helpValue: '<option>',
    }),
    clientid: Flags.string({
      description: messages.getMessage('clientId'),
      char: 'i',
      helpValue: '<value>',
    }),
    'instance-url': Flags.string({
      description: messages.getMessage('instanceUrl'),
      default: 'https://login.salesforce.com',
      char: 'l',
      helpValue: '<value>',
    }),
    'jwt-key-file': Flags.string({
      description: messages.getMessage('jwtFile'),
      dependsOn: ['username', 'clientid'],
      char: 'f',
      helpValue: '<value>',
    }),
    'set-default': Flags.boolean({
      char: 'd',
      description: messages.getMessage('setDefault'),
    }),
    username: Flags.string({
      description: messages.getMessage('jwtUser'),
      dependsOn: ['jwt-key-file', 'clientid'],
      char: 'u',
      helpValue: '<value>',
    }),
  };

  public flags: {
    alias: string;
    clientid: string;
    username: string;
    browser: string;
    'instance-url': string;
    'jwt-key-file': string;
    'set-default': boolean;
  };

  public async run(): Promise<AuthFields> {
    await this.setFlags();

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

  private async setFlags(): Promise<void> {
    const flags = (await this.parse(LoginOrg)).flags;

    if (flags.browser?.toLowerCase().includes('chrome')) {
      flags.browser = open.apps.chrome as string;
    }

    if (flags.browser?.toLowerCase().includes('firefox')) {
      flags.browser = open.apps.firefox as string;
    }

    this.flags = flags;
  }

  private determineConnectMethod(): LoginMethod {
    if (this.flags['jwt-file'] && this.flags['jwt-user'] && this.flags.clientid) return LoginMethod.ORG_JWT;
    else return LoginMethod.ORG_WEB;
  }

  private async handleSideEffects(authInfo: AuthInfo): Promise<void> {
    if (this.flags.alias) await authInfo.setAlias(this.flags.alias);
    if (this.flags['set-default']) await authInfo.setAsDefault({ defaultUsername: true });
  }

  private async executeJwtOrgFlow(): Promise<AuthInfo> {
    this.log('Executing salesforce org JWT auth flow...');
    try {
      const oauth2OptionsBase = {
        clientId: this.flags.clientid,
        privateKeyFile: this.flags['jwt-key-file'],
      };

      const loginUrl = this.flags['instance-url'];

      const oauth2Options = loginUrl ? Object.assign(oauth2OptionsBase, { loginUrl }) : oauth2OptionsBase;

      let authInfo: AuthInfo;
      try {
        authInfo = await AuthInfo.create({ username: this.flags.username, oauth2Options });
      } catch (error) {
        const err = error as SfdxError;
        if (err.name === 'AuthInfoOverwriteError') {
          this.debug('Auth file already exists. Removing and starting fresh.');
          const remover = await AuthRemover.create();
          await remover.removeAuth(this.flags.username);
          authInfo = await AuthInfo.create({
            username: this.flags.username,
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
      const oauthConfig: OAuth2Options = this.flags['instance-url'] ? { loginUrl: this.flags['instance-url'] } : {};
      const oauthServer = await WebOAuthServer.create({ oauthConfig });
      await oauthServer.start();
      const openOpts = this.flags.browser ? { wait: false, app: { name: this.flags.browser } } : { wait: false };
      await open(oauthServer.getAuthorizationUrl(), openOpts);
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
