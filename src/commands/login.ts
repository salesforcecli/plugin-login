/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { prompt, Answers } from 'inquirer';
import { AuthFields, Messages, OrgConfigProperties } from '@salesforce/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { executeOrgWebFlow, handleSideEffects, OrgSideEffects } from '../loginUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'login');

export enum LoginTarget {
  ORG = 'Salesforce Org',
  FUNCTIONS = 'Salesforce Functions',
}

const LoginCommands: Record<LoginTarget, string> = {
  [LoginTarget.FUNCTIONS]: 'login:functions',
  [LoginTarget.ORG]: 'login:org',
};

export default class Login extends SfCommand<AuthFields> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static enableJsonFlag = false;
  public static readonly flags = {};

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

    const sideEffects = await promptUserForOrgSideEffects();
    await handleSideEffects(authInfo, sideEffects);

    const successMsg = messages.getMessage('success', [fields.username]);
    this.log(successMsg);

    return fields;
  }

  public async executeFunctionsLogin(): Promise<AuthFields> {
    await this.config.runCommand(LoginCommands[LoginTarget.FUNCTIONS]);
    return {};
  }

  private async promptUserToChooseLoginTarget(): Promise<LoginTarget> {
    const choices: LoginTarget[] = [];
    for (const [key, cmd] of Object.entries(LoginCommands) as Array<[LoginTarget, string]>) {
      if (this.config.commandIDs.includes(cmd)) {
        choices.push(key);
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
}

const promptUserForOrgSideEffects = async (): Promise<OrgSideEffects> => {
  const responses = await prompt<{ alias: string; configs: string[] }>([
    {
      name: 'alias',
      message: 'Set an alias for the org (leave blank for no alias)',
      type: 'input',
    },
    {
      name: 'configs',
      message: 'Set the org as your default org?',
      type: 'checkbox',
      choices: [OrgConfigProperties.TARGET_DEV_HUB, OrgConfigProperties.TARGET_ORG],
    },
  ]);
  return {
    alias: responses.alias,
    setDefault: responses.configs.includes(OrgConfigProperties.TARGET_ORG),
    setDefaultDevHub: responses.configs.includes(OrgConfigProperties.TARGET_DEV_HUB),
  };
};
