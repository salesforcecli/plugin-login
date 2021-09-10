/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags, HelpSection } from '@oclif/core';
import { AuthRemover, GlobalInfo, Messages, OrgConfigProperties, SfdxPropertyKeys } from '@salesforce/core';
import { prompt } from 'inquirer';
import { SfCommand } from '@salesforce/command';
import { toHelpSection } from '@salesforce/sf-plugins-core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'logout.org');

/**
 * A list of account and environment names that were successfully logged out.
 */
export type OrgLogoutResult = {
  success: boolean;
  username: string;
};

export default class LogoutOrg extends SfCommand<OrgLogoutResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {
    'target-org': Flags.string({
      description: messages.getMessage('flags.target-org.summary'),
      char: 'o',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      description: messages.getMessage('flags.no-prompt.summary'),
      default: false,
    }),
  };

  public static configurationVariablesSection?: HelpSection = toHelpSection(
    'CONFIGURATION VARIABLES',
    SfdxPropertyKeys.API_VERSION,
    SfdxPropertyKeys.INSTANCE_URL,
    OrgConfigProperties.TARGET_ORG
  );

  private remover!: AuthRemover;

  public async run(): Promise<OrgLogoutResult> {
    const { flags } = await this.parse(LogoutOrg);
    this.remover = await AuthRemover.create();
    const globalInfo = await GlobalInfo.getInstance();
    const username = globalInfo.aliases.resolveUsername(flags['target-org']);
    let success = true;
    if (flags['no-prompt']) {
      success = await this.remove(username);
    } else {
      if (await this.promptForConfirmation(username)) {
        success = await this.remove(username);
      } else {
        success = false;
        return { success, username };
      }
    }

    if (success) {
      this.log(messages.getMessage('success', [username]));
    } else {
      process.exitCode = 1;
      this.log(messages.getMessage('failure', [username]));
    }

    return { success, username };
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
