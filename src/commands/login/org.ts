/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as open from 'open';

import { Flags } from '@oclif/core';
import { EnvironmentVariable, Messages, SfdxPropertyKeys } from '@salesforce/core';
import { SfCommand, toHelpSection } from '@salesforce/sf-plugins-core';
import { executeOrgWebFlow, handleSideEffects, validateInstanceUrl } from '../../loginUtils';
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'login.org');

export type LoginOrgResult = {
  alias?: string;
  loginUrl: string;
  orgId: string;
  username: string;
};

export default class LoginOrg extends SfCommand<LoginOrgResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static flags = {
    alias: Flags.string({
      description: messages.getMessage('flags.alias.summary'),
      char: 'a',
    }),
    browser: Flags.string({
      summary: messages.getMessage('flags.browser.summary'),
      description: messages.getMessage('flags.browser.description'),
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
    'set-default-dev-hub': Flags.boolean({
      char: 'v',
      description: messages.getMessage('flags.set-default-dev-hub.summary'),
    }),
  };

  public static configurationVariablesSection = toHelpSection(
    'CONFIGURATION VARIABLES',
    SfdxPropertyKeys.API_VERSION,
    SfdxPropertyKeys.INSTANCE_URL
  );

  public static envVariablesSection = toHelpSection(
    'ENVIRONMENT VARIABLES',
    EnvironmentVariable.SF_INSTANCE_URL,
    EnvironmentVariable.SFDX_INSTANCE_URL
  );

  public flags: {
    alias: string;
    clientid: string;
    browser: string;
    'instance-url': string;
    'set-default': boolean;
    'set-default-dev-hub': boolean;
  };

  public async run(): Promise<LoginOrgResult> {
    await this.setFlags();
    validateInstanceUrl(this.flags['instance-url']);
    const authInfo = await executeOrgWebFlow({ loginUrl: this.flags['instance-url'], browser: this.flags.browser });
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
      loginUrl: fields.loginUrl,
      orgId: fields.orgId,
      username: fields.username,
    };
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
