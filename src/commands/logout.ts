/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// import { prompt, Answers } from 'inquirer';
import { Command } from '@oclif/core';
import { AuthRemover, Messages, SfdxError } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'logout');

/**
 * A list of account and environment names that were successfully logged out.
 */
export type AuthenticationNames = string[];
export default class Logout extends Command {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {};

  public async run(): Promise<AuthenticationNames> {
    const remover = await AuthRemover.create();
    const authenticationNames = Object.keys(remover.findAllAuths());

    try {
      await remover.removeAllAuths();
    } catch (e) {
      throw new SfdxError(e, 'LogoutError');
    }

    this.log(messages.getMessage('success'));

    return authenticationNames;
  }
}
