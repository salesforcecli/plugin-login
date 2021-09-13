/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { AuthRemover, SfOrgs } from '@salesforce/core';
import { cli } from 'cli-ux';
import { LogoutResponse } from '../../src/commands/logout';

const sfOrgs: SfOrgs = {
  'some-other-user@some.other.salesforce.com': {
    orgId: '00Dxx54321987654321',
    accessToken: '00Dxx54321987654321!lasfdlkjasfdljkerwklj;afsdlkjdhk;f',
    instanceUrl: 'https://some.other.salesforce.com',
    alias: 'someOtherAlias',
    oauthMethod: 'web',
    username: 'some-other-user@some.other.salesforce.com',
    error: 'some auth error',
    timestamp: '2020-01-01T00:00:00.000Z',
  },
};

class MyAuthRemover extends AuthRemover {
  public findAllAuths(): SfOrgs {
    return sfOrgs;
  }
  public async removeAllAuths(): Promise<void> {}
  public async removeAuth(): Promise<void> {}
}

describe('logout unit tests', () => {
  test
    .stub(AuthRemover, 'create', async (): Promise<MyAuthRemover> => {
      return new MyAuthRemover();
    })
    .stdout()
    .command(['logout', '--no-prompt'])
    .it('should remove all env auths without confirmation prompt', (ctx) => {
      const stdout = ctx.stdout;
      expect(stdout).to.contain(
        'You are now logged out of these environments: some-other-user@some.other.salesforce.com.'
      );
    });
  test
    .stub(AuthRemover, 'create', async (): Promise<MyAuthRemover> => {
      return new MyAuthRemover();
    })
    .stub(cli, 'confirm', async (): Promise<boolean> => true)
    .stdout()
    .command(['logout', '--no-prompt', '--json'])
    .it('should remove all env auths without confirmation prompt - json output', (ctx) => {
      const stdout = ctx.stdout;
      const names = JSON.parse(stdout) as { result: LogoutResponse };
      expect(names.result.successes).to.be.deep.equal(['some-other-user@some.other.salesforce.com']);
    });
});
