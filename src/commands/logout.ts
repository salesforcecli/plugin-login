/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// import { prompt, Answers } from 'inquirer';
import { Command } from '@oclif/core';
import { AuthRemover, Messages, SfOrgs, SfdxError } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'logout');

export default class Logout extends Command {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {};

  public async run(): Promise<SfOrgs> {
    const remover = await AuthRemover.create();

    try {
      await remover.removeAllAuths();
    } catch (e) {
      throw new SfdxError(e, 'LogoutError');
    }

    const successMsg = messages.getMessage('success');
    this.log(successMsg);

    return remover.findAllAuths();
  }
}
