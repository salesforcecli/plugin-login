/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags } from '@oclif/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { prompt, Separator } from 'inquirer';
import * as chalk from 'chalk';
import { Deauthorizer, SfHook } from '@salesforce/sf-plugins-core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-login', 'logout');

export type LogoutResponse = {
  successes: string[];
  failures: string[];
};

type DeauthorizerInfo = { deauthorizer: Deauthorizer; id: string };
type DeauthorizerHash = Record<string, DeauthorizerInfo>;

export default class Logout extends SfCommand<LogoutResponse> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static flags = {
    'no-prompt': Flags.boolean({
      description: messages.getMessage('flags.no-prompt.summary'),
      default: false,
    }),
  };

  public async run(): Promise<LogoutResponse> {
    const { flags } = await this.parse(Logout);
    const hookResults = await SfHook.run(this.config, 'sf:logout');
    const deauthorizers = hookResults.successes.flatMap((r) => r.result);

    if (flags['no-prompt']) {
      this.log(chalk.red.bold('Running logout with no prompts. This will log you out of all your environments.'));
      const results = { successes: [], failures: [] } as LogoutResponse;

      for (const deauthorizer of deauthorizers) {
        const result = await deauthorizer.removeAll();
        results.successes.push(...result.successes);
        results.failures.push(...result.failures);
      }
      this.log(messages.getMessage('success', [results.successes.join(', ')]));
      if (results.failures.length) {
        process.exitCode = 1;
        this.log(messages.getMessage('failure', [results.failures.join(', ')]));
      }
      return results;
    }

    const { selected, confirmed } = await this.promptForEnvironments(deauthorizers);

    if (!selected.length) {
      this.log(messages.getMessage('no-environments'));
      return { successes: [], failures: [] };
    }

    if (!confirmed) {
      return { successes: [], failures: [] };
    } else if (!selected.length) {
      this.log(messages.getMessage('no-environments'));
      return { successes: [], failures: [] };
    } else if (confirmed && selected.length) {
      const results = { successes: [], failures: [] } as LogoutResponse;

      for (const env of selected) {
        const result = await env.deauthorizer.remove(env.id);
        if (result) results.successes.push(env.id);
        else results.failures.push(env.id);
      }

      this.log(messages.getMessage('success', [results.successes.join(', ')]));
      if (results.failures.length) {
        process.exitCode = 1;
        this.log(messages.getMessage('failure', [results.failures.join(', ')]));
      }
      return results;
    } else {
      return { successes: [], failures: [] };
    }
  }

  private async promptForEnvironments(
    deauthorizers: Deauthorizer[]
  ): Promise<{ selected: DeauthorizerInfo[]; confirmed: boolean }> {
    const hash: DeauthorizerHash = {};
    for (const deauthorizer of deauthorizers) {
      const envs = await deauthorizer.find();
      Object.entries(envs).forEach(([id, env]) => {
        const aliases = (env.aliases as string[]) ?? [];
        const displayName = aliases.length ? `${id} (${aliases.join(', ')})` : `${id}`;
        hash[displayName] = { deauthorizer, id };
      });
    }

    const maxKeyLength = Object.keys(hash).reduce((a, b) => Math.max(a, b.length), 0);
    const { envs, confirmed } = await prompt<{ envs: string[]; confirmed: boolean }>([
      {
        name: 'envs',
        message: messages.getMessage('prompt.select-envs'),
        type: 'checkbox',
        choices: [...Object.keys(hash).sort(), new Separator('-'.repeat(maxKeyLength))],
        loop: true,
      },
      {
        name: 'confirmed',
        when: (answers): boolean => answers.envs.length > 0,
        message: (answers): string => {
          this.log(messages.getMessage('warning'));
          const names = answers.envs.map((a) => hash[a].id);
          if (names.length === Object.keys(hash).length) {
            return messages.getMessage('prompt.confirm-all');
          } else {
            return messages.getMessage('prompt.confirm', [names.length, names.length > 1 ? 's' : '']);
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
}
