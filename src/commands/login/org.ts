/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as open from 'open';

import { Command, Flags } from '@oclif/core';
import { AuthFields, Messages } from '@salesforce/core';
import { executeOrgWebFlow, handleSideEffects } from '../../loginUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'login.org');

export default class LoginOrg extends Command {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static flags = {
    alias: Flags.string({
      description: messages.getMessage('flags.alias.summary'),
      char: 'a',
    }),
    browser: Flags.string({
      description: messages.getMessage('flags.browser.summary'),
      char: 'b',
    }),
    clientid: Flags.string({
      description: messages.getMessage('flags.clientid.summary'),
      char: 'i',
    }),
    'instance-url': Flags.string({
      summary: messages.getMessage('flags.instance-url.summary'),
      description: messages.getMessage('flags.instance-url.description'),
      default: 'https://login.salesforce.com',
      char: 'l',
    }),
    'set-default': Flags.boolean({
      char: 'd',
      description: messages.getMessage('flags.set-default.summary'),
    }),
  };

  public flags: {
    alias: string;
    clientid: string;
    browser: string;
    'instance-url': string;
    'set-default': boolean;
  };

  public async run(): Promise<AuthFields> {
    await this.setFlags();
    const authInfo = await executeOrgWebFlow({ loginUrl: this.flags['instance-url'], browser: this.flags.browser });
    await handleSideEffects(authInfo, { alias: this.flags.alias, setDefault: this.flags['set-default'] });
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
}
