/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// import { prompt, Answers } from 'inquirer';
import { Command, Flags } from '@oclif/core';
import { AuthRemover, Messages, SfdxError } from '@salesforce/core';
import { cli } from 'cli-ux';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'logout');

/**
 * A list of account and environment names that were successfully logged out.
 */
export type AuthenticationNames = string[];
export default class Logout extends Command {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {
    noprompt: Flags.boolean({
      description: messages.getMessage('flags.noprompt.summary'),
      default: false,
    }),
  };

  public async run(): Promise<AuthenticationNames> {
    const flags = (await this.parse(Logout)).flags;

    const remover = await AuthRemover.create();
    const authenticationNames = Object.keys(remover.findAllAuths());

    try {
      if (authenticationNames.length > 0) {
        if (await this.haveConfirmation(flags.noprompt, authenticationNames.length)) {
          await remover.removeAllAuths();
        } else {
          this.log(messages.getMessage('no-authentications-logged-out'));
          return [];
        }
      }
    } catch (e) {
      throw new SfdxError(e, 'LogoutError');
    }

    this.log(messages.getMessage('success'));

    return authenticationNames;
  }

  private async haveConfirmation(noPrompt: boolean, count: number): Promise<boolean> {
    if (noPrompt) return true;
    return await cli.confirm(messages.getMessage('config-removal-of-all-environment-authentications', [count]));
  }
}
