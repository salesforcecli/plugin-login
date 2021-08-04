/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { AuthRemover, SfOrg, SfOrgs } from '@salesforce/core';
import { cli } from 'cli-ux';
import { EnvironmentNames } from '../../lib/commands/logout';

const expectedSfOrgs: SfOrg[] = [
  {
    orgId: '00Dxx54321987654321',
    accessToken: '00Dxx54321987654321!lasfdlkjasfdljkerwklj;afsdlkjdhk;f',
    instanceUrl: 'https://some.other.salesforce.com',
    alias: 'someOtherAlias',
    oauthMethod: 'web',
    username: 'some-other-user@some.other.salesforce.com',
    error: 'some auth error',
  },
];

const sfOrgs = expectedSfOrgs
  .map((sfOrg) => {
    const newSfOrg = {} as SfOrg;
    newSfOrg[sfOrg.username] = sfOrg;
    return newSfOrg;
  })
  .reduce((a, b) => {
    return Object.assign(a, { ...b });
  }, {} as SfOrgs);

class MyAuthRemover extends AuthRemover {
  public findAllAuths(): SfOrgs {
    return sfOrgs;
  }
  public async removeAllAuths(): Promise<void> {}
}

describe('logout unit tests', () => {
  test
    .stub(AuthRemover, 'create', async (): Promise<MyAuthRemover> => {
      return new MyAuthRemover();
    })
    .stdout()
    .command(['logout', '--noprompt'])
    .it('should remove all env auths without confirmation prompt', (ctx) => {
      const stdout = ctx.stdout;
      expect(stdout).to.contain(`You are now logged out of these environments: ${expectedSfOrgs[0].username}.`);
    });
  test
    .stub(AuthRemover, 'create', async (): Promise<MyAuthRemover> => {
      return new MyAuthRemover();
    })
    .stub(cli, 'confirm', async (): Promise<boolean> => true)
    .stdout()
    .command(['logout', '--noprompt', '--json'])
    .it('should remove all env auths without confirmation prompt - json output', (ctx) => {
      const stdout = ctx.stdout;
      const names = JSON.parse(stdout) as EnvironmentNames;
      expect(names).to.be.deep.equal(expectedSfOrgs.map((org) => org.username));
    });
});
