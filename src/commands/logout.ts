/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Command, Flags } from '@oclif/core';
import { AuthRemover, GlobalInfo, Messages } from '@salesforce/core';
import { prompt } from 'inquirer';
import * as chalk from 'chalk';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'logout');

/**
 * A list of account and environment names that were successfully logged out.
 */
export type EnvironmentNames = string[];
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

  public async run(): Promise<EnvironmentNames> {
    const { flags } = await this.parse(Logout);
    // NOTE: AuthRemover is specific to org logout. Once we add other environment
    // types we'll want to make AuthRemover more generalized
    const remover = await AuthRemover.create();

    if (flags.noprompt) {
      this.log(chalk.red.bold('Running logout with no prompts. This will log you out of all your environments.'));
      const environments = Object.keys(remover.findAllAuths());
      await remover.removeAllAuths();
      this.log(messages.getMessage('success', [environments.join(', ')]));
      return environments;
    }

    const { selected, confirmed } = await this.promptForEnvironments(remover);
    if (!confirmed) return [];
    if (!selected.length) {
      this.log(messages.getMessage('no-environments'));
      return [];
    }
    if (confirmed && selected.length) {
      for (const env of selected) {
        await remover.removeAuth(env);
      }
      this.log(messages.getMessage('success', [selected.join(', ')]));
    }

    return selected;
  }

  private async promptForEnvironments(remover: AuthRemover): Promise<{ selected: string[]; confirmed: boolean }> {
    const globalInfo = await GlobalInfo.getInstance();
    const environments = remover.findAllAuths();
    const hash = Object.keys(environments).reduce((result, username) => {
      const aliases = globalInfo.aliases.getAll(username);
      const displayUsername = aliases.length ? `${username} (${aliases.join(', ')})` : `${username}`;
      return { ...result, [displayUsername]: username };
    }, {} as Record<string, string>);
    const { auths, confirmed } = await prompt<{ auths: string[]; confirmed: boolean }>([
      {
        name: 'auths',
        message: messages.getMessage('prompt.select-envs'),
        type: 'checkbox',
        choices: Object.keys(hash),
        loop: true,
      },
      {
        name: 'confirmed',
        message: (answers): string => {
          const names = answers.auths.map((a) => hash[a]);
          if (names.length === Object.keys(hash).length) {
            return messages.getMessage('prompt.confirm-all');
          } else {
            return messages.getMessage('prompt.confirm', [names.length]);
          }
        },
        type: 'confirm',
      },
    ]);
    return {
      selected: auths.map((a) => hash[a]),
      confirmed,
    };
  }
}
