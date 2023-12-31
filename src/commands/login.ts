/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */



import { AuthFields, Messages } from '@salesforce/core';
import { SfCommand } from '@salesforce/sf-plugins-core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url)
const messages = Messages.loadMessages('@salesforce/plugin-login', 'login');

export enum LoginTarget {
  FUNCTIONS = 'Salesforce Functions',
}

const LoginCommands: Record<LoginTarget, string> = {
  [LoginTarget.FUNCTIONS]: 'login:functions',
};

export default class Login extends SfCommand<AuthFields> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static enableJsonFlag = false;
  public static readonly hidden = true;
  public static readonly flags = {};
  public static readonly state = 'deprecated';
  public static readonly deprecationOptions = {
    message: messages.getMessage('deprecationMessage'),
    version: '58.0',
  };

  public async run(): Promise<AuthFields> {
    return this.executeFunctionsLogin();
  }

  public async executeFunctionsLogin(): Promise<AuthFields> {
    await this.config.runCommand(LoginCommands[LoginTarget.FUNCTIONS]);
    return {};
  }
}
