/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags } from '@oclif/core';
import { SfCommand } from '@salesforce/command';
import { AuthInfo, AuthRemover, EnvironmentVariable, Messages, SfdxError, SfdxPropertyKeys } from '@salesforce/core';
import { getString } from '@salesforce/ts-types';
import { toHelpSection } from '@salesforce/sf-plugins-core';
import { handleSideEffects, validateInstanceUrl } from '../../../loginUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'login.org.jwt');

export type LoginOrgJwtResult = {
  alias?: string;
  instanceUrl: string;
  orgId: string;
  username: string;
  privateKey: string;
};

export default class LoginOrgJwt extends SfCommand<LoginOrgJwtResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {
    alias: Flags.string({
      summary: messages.getMessage('flags.alias.summary'),
      char: 'a',
      helpValue: '<value>',
    }),
    clientid: Flags.string({
      summary: messages.getMessage('flags.clientid.summary'),
      char: 'i',
      helpValue: '<value>',
    }),
    'instance-url': Flags.string({
      summary: messages.getMessage('flags.instance-url.summary'),
      description: messages.getMessage('flags.instance-url.description'),
      default: 'https://login.salesforce.com',
      char: 'l',
      helpValue: '<value>',
    }),
    keyfile: Flags.string({
      summary: messages.getMessage('flags.keyfile.summary'),
      dependsOn: ['username', 'clientid'],
      char: 'f',
      helpValue: '<value>',
    }),
    'set-default': Flags.boolean({
      char: 'd',
      summary: messages.getMessage('flags.set-default.summary'),
    }),
    'set-default-dev-hub': Flags.boolean({
      char: 'v',
      description: messages.getMessage('flags.set-default-dev-hub.summary'),
    }),
    username: Flags.string({
      summary: messages.getMessage('flags.username.summary'),
      dependsOn: ['keyfile', 'clientid'],
      char: 'u',
      helpValue: '<value>',
    }),
  };

  public static configurationVariablesSection = toHelpSection(
    'CONFIGURATION VARIABLES',
    SfdxPropertyKeys.API_VERSION,
    SfdxPropertyKeys.INSTANCE_URL
  );

  public static envVariablesSection = toHelpSection('ENVIRONMENT VARIABLES', EnvironmentVariable.SF_INSTANCE_URL);

  public flags: {
    alias: string;
    clientid: string;
    username: string;
    'instance-url': string;
    keyfile: string;
    'set-default': boolean;
    'set-default-dev-hub': boolean;
  };

  public async run(): Promise<LoginOrgJwtResult> {
    this.flags = (await this.parse(LoginOrgJwt)).flags;

    validateInstanceUrl(this.flags['instance-url']);

    const authInfo = await this.executeJwtOrgFlow();

    await handleSideEffects(authInfo, {
      alias: this.flags.alias,
      setDefault: this.flags['set-default'],
      setDefaultDevHub: this.flags['set-default-dev-hub'],
    });
    const fields = authInfo.getFields(true);
    const successMsg = `Successfully authorized ${fields.username} with ID ${fields.orgId}`;
    this.log(successMsg);
    return {
      alias: fields.alias,
      instanceUrl: fields.instanceUrl,
      orgId: fields.orgId,
      username: fields.username,
      privateKey: fields.privateKey,
    };
  }

  private async executeJwtOrgFlow(): Promise<AuthInfo> {
    this.log('Executing salesforce org JWT auth flow...');
    try {
      const oauth2OptionsBase = {
        clientId: this.flags.clientid,
        privateKeyFile: this.flags.keyfile,
      };

      const loginUrl = this.flags['instance-url'];

      const oauth2Options = loginUrl ? { ...oauth2OptionsBase, ...{ loginUrl } } : oauth2OptionsBase;

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
      throw messages.createError('error.JwtGrant', [msg]);
    }
  }
}
