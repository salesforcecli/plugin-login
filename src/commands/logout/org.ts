/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { AuthRemover, StateAggregator, Messages, OrgConfigProperties, SfdxPropertyKeys } from '@salesforce/core';
import { prompt } from 'inquirer';
import { Flags, SfCommand, toHelpSection } from '@salesforce/sf-plugins-core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'logout.org');

export type OrgLogoutResult = {
  username: string;
};

export default class LogoutOrg extends SfCommand<OrgLogoutResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly flags = {
    'target-org': Flags.string({
      summary: messages.getMessage('flags.target-org.summary'),
      char: 'o',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      summary: messages.getMessage('flags.no-prompt.summary'),
      default: false,
    }),
  };

  public static configurationVariablesSection = toHelpSection(
    'CONFIGURATION VARIABLES',
    SfdxPropertyKeys.API_VERSION,
    SfdxPropertyKeys.INSTANCE_URL,
    OrgConfigProperties.TARGET_ORG
  );

  private remover!: AuthRemover;

  public async run(): Promise<OrgLogoutResult> {
    const { flags } = await this.parse(LogoutOrg);
    this.remover = await AuthRemover.create();
    const stateAggregator = await StateAggregator.getInstance();
    const username = stateAggregator.aliases.resolveUsername(flags['target-org']);
    let success = true;
    if (flags['no-prompt']) {
      success = await this.remove(username);
    } else if (await this.promptForConfirmation(username)) {
      success = await this.remove(username);
    } else {
      success = false;
      return { username };
    }

    if (success) {
      this.log(messages.getMessage('success', [username]));
    } else {
      process.exitCode = 1;
      this.log(messages.getMessage('failure', [username]));
    }

    return { username };
  }

  private async promptForConfirmation(username: string): Promise<boolean> {
    this.log(messages.getMessage('warning'));
    const { confirmed } = await prompt<{ confirmed: boolean }>([
      {
        name: 'confirmed',
        message: messages.getMessage('prompt.confirm', [username]),
        type: 'confirm',
      },
    ]);
    return confirmed;
  }

  private async remove(username: string): Promise<boolean> {
    try {
      await this.remover.removeAuth(username);
      return true;
    } catch (e) {
      return false;
    }
  }
}
