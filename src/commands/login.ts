/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { prompt, Answers } from 'inquirer';
import { SfCommand } from '@salesforce/command';
import { AuthFields, Messages } from '@salesforce/core';
import { executeOrgWebFlow, handleSideEffects, OrgSideEffects } from '../loginUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'login');

// eslint-disable-next-line no-shadow
export enum LoginTarget {
  ORG = 'Salesforce Org',
  FUNCTIONS = 'Salesforce Functions',
}

// eslint-disable-next-line no-shadow
export enum LoginCommands {
  FUNCTIONS = 'login:functions',
}

export default class Login extends SfCommand<AuthFields> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static disableJsonFlag = true;
  public static flags = {};

  public async run(): Promise<AuthFields> {
    const target = await this.promptUserToChooseLoginTarget();
    switch (target) {
      case LoginTarget.ORG:
        return this.executeOrgLogin();
      case LoginTarget.FUNCTIONS:
        return this.executeFunctionsLogin();
      default:
        break;
    }
  }

  public async executeOrgLogin(): Promise<AuthFields> {
    const authInfo = await executeOrgWebFlow();
    const fields = authInfo.getFields(true);

    const sideEffects = await this.promptUserForOrgSideEffects();
    await handleSideEffects(authInfo, sideEffects);

    const successMsg = messages.getMessage('success', [fields.username]);
    this.log(successMsg);

    return fields;
  }

  public async executeFunctionsLogin(): Promise<AuthFields> {
    await this.config.runCommand(LoginCommands.FUNCTIONS);
    return {};
  }

  private async promptUserToChooseLoginTarget(): Promise<LoginTarget> {
    const choices = [LoginTarget.ORG];

    for (const [key, cmd] of Object.entries(LoginCommands)) {
      if (this.config.commandIDs.includes(cmd)) {
        choices.push(LoginTarget[key]);
      }
    }

    const responses = await prompt<Answers>([
      {
        name: 'target',
        message: 'What would you like to log into?',
        type: 'list',
        choices,
      },
    ]);

    return responses.target as LoginTarget;
  }

  private async promptUserForOrgSideEffects(): Promise<OrgSideEffects> {
    const responses = await prompt<OrgSideEffects>([
      {
        name: 'alias',
        message: 'Set an alias for the org (leave blank for no alias)',
        type: 'input',
      },
      {
        name: 'setDefault',
        message: 'Set the org as your default org?',
        type: 'confirm',
      },
    ]);
    return responses;
  }
}
