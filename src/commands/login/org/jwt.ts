/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Command, Flags } from '@oclif/core';
import { AuthFields, AuthInfo, AuthRemover, Messages, SfdxError } from '@salesforce/core';
import { getString } from '@salesforce/ts-types';
import { handleSideEffects } from '../../../loginUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-login', 'login.org.jwt', [
  'alias',
  'audienceUrl',
  'clientId',
  'description',
  'examples',
  'instanceUrl',
  'invalidClientId',
  'jwtFile',
  'jwtUser',
  'setDefault',
]);

export default class LoginOrgJwt extends Command {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {
    alias: Flags.string({
      description: messages.getMessage('alias'),
      char: 'a',
      helpValue: '<value>',
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
    'instance-url': string;
    'jwt-key-file': string;
    'set-default': boolean;
  };

  public async run(): Promise<AuthFields> {
    this.flags = (await this.parse(LoginOrgJwt)).flags;

    const authInfo = await this.executeJwtOrgFlow();

    await handleSideEffects(authInfo, { alias: this.flags.alias, setDefault: this.flags['set-default'] });
    const fields = authInfo.getFields(true);
    const successMsg = `Successfully authorized ${fields.username} with ID ${fields.orgId}`;
    this.log(successMsg);
    return fields;
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
}
