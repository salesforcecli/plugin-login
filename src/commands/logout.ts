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

export type LogoutResponse = {
  successes: string[];
  failures: string[];
};

export default class Logout extends Command {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {
    'no-prompt': Flags.boolean({
      description: messages.getMessage('flags.no-prompt.summary'),
      default: false,
    }),
  };

  private remover!: AuthRemover;

  public async run(): Promise<LogoutResponse> {
    const { flags } = await this.parse(Logout);
    // NOTE: AuthRemover is specific to org logout. Once we add other environment
    // types we'll want to make AuthRemover more generalized
    this.remover = await AuthRemover.create();

    if (flags['no-prompt']) {
      this.log(chalk.red.bold('Running logout with no prompts. This will log you out of all your environments.'));
      const environments = Object.keys(this.remover.findAllAuths());
      const response = await this.remove(environments);
      this.log(messages.getMessage('success', [response.successes.join(', ')]));
      if (response.failures.length) {
        process.exitCode = 1;
        this.log(messages.getMessage('failure', [response.failures.join(', ')]));
      }
      return response;
    }

    const { selected, confirmed } = await this.promptForEnvironments();
    if (!confirmed) {
      return { successes: [], failures: [] };
    } else if (!selected.length) {
      this.log(messages.getMessage('no-environments'));
      return { successes: [], failures: [] };
    } else if (confirmed && selected.length) {
      const response = await this.remove(selected);
      this.log(messages.getMessage('success', [response.successes.join(', ')]));
      if (response.failures.length) {
        process.exitCode = 1;
        this.log(messages.getMessage('failure', [response.failures.join(', ')]));
      }
      return response;
    } else {
      return { successes: [], failures: [] };
    }
  }

  private async promptForEnvironments(): Promise<{ selected: string[]; confirmed: boolean }> {
    const globalInfo = await GlobalInfo.getInstance();
    const environments = this.remover.findAllAuths();
    const hash = Object.keys(environments).reduce((result, username) => {
      const aliases = globalInfo.aliases.getAll(username);
      const displayUsername = aliases.length ? `${username} (${aliases.join(', ')})` : `${username}`;
      return { ...result, [displayUsername]: username };
    }, {} as Record<string, string>);
    const { envs, confirmed } = await prompt<{ envs: string[]; confirmed: boolean }>([
      {
        name: 'envs',
        message: messages.getMessage('prompt.select-envs'),
        type: 'checkbox',
        choices: Object.keys(hash),
        loop: true,
      },
      {
        name: 'confirmed',
        message: (answers): string => {
          this.log(messages.getMessage('warning'));
          const names = answers.envs.map((a) => hash[a]);
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
      selected: envs.map((a) => hash[a]),
      confirmed,
    };
  }

  private async remove(environments: string[]): Promise<LogoutResponse> {
    const successes = [] as string[];
    const failures = [] as string[];
    this.log(messages.getMessage('warning'));
    for (const env of environments) {
      try {
        await this.remover.removeAuth(env);
        successes.push(env);
      } catch {
        failures.push(env);
      }
    }
    return { successes, failures };
  }
}
