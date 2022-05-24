/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as fs from 'fs';
import * as path from 'path';
import { execCmd, TestSession, prepareForJwt } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Env } from '@salesforce/kit';
import { ensureString } from '@salesforce/ts-types';
import { Global } from '@salesforce/core';
import { exec } from 'shelljs';

let testSession: TestSession;

(process.platform !== 'win32' ? describe : describe.skip)('logout NUTs', () => {
  const env = new Env();
  env.setString('TESTKIT_EXECUTABLE_PATH', path.join(process.cwd(), 'bin', 'dev'));

  const scratchOrgAlias = 'scratchorg';
  const devhubAlias = 'devhub';
  let username: string;
  let instanceUrl: string;
  let clientId: string;
  let jwtKey: string;
  let scratchOrgUsername: string;

  const authFileExists = async (uname: string): Promise<boolean> => {
    try {
      await fs.promises.access(path.join(testSession.homeDir, Global.STATE_FOLDER, `${uname}.json`));
      return true;
    } catch {
      return false;
    }
  };

  const getConfig = (): Array<Record<string, string>> => {
    return execCmd<Array<Record<string, string>>>('config list --json', { cli: 'sf' }).jsonOutput.result;
  };

  const getAliases = (): Array<Record<string, string>> => {
    return execCmd<Array<Record<string, string>>>('alias list --json', { cli: 'sf' }).jsonOutput.result;
  };

  before('prepare session and ensure environment variables', async () => {
    username = ensureString(env.getString('TESTKIT_HUB_USERNAME'));
    instanceUrl = ensureString(env.getString('TESTKIT_HUB_INSTANCE'));
    clientId = ensureString(env.getString('TESTKIT_JWT_CLIENT_ID'));
    ensureString(env.getString('TESTKIT_JWT_KEY'));

    testSession = await TestSession.create({
      project: { name: 'logoutNUTs' },
    });
  });

  beforeEach(() => {
    jwtKey = prepareForJwt(testSession.homeDir);
    execCmd(`login org jwt -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --json`);
    const orgCreate = exec(
      `sfdx force:org:create -f config/project-scratch-def.json -s -d 1 -a ${scratchOrgAlias} -v ${username}`,
      { silent: true }
    );

    if (orgCreate.code > 0) {
      throw new Error(`Failed to scratch scratch org: ${orgCreate.stderr}`);
    }

    scratchOrgUsername = getAliases().find((a) => a.alias === scratchOrgAlias).value;
  });

  afterEach(async () => {
    try {
      execCmd(`login org jwt -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --json`);
      exec(`sfdx force:org:delete -p -u ${scratchOrgAlias} -v ${username}`, { silent: true });
    } catch {
      // its okay if this fails
    }
  });

  after(async () => {
    await testSession?.clean();
  });

  it('should logout of all environments', async () => {
    execCmd(`alias set ${devhubAlias}=${username}`, { ensureExitCode: 0 });
    execCmd(`config set target-org=${username} --global`, { ensureExitCode: 0 });
    execCmd('logout', { cli: 'sf', ensureExitCode: 0, answers: ['a', 'Y'] });

    const config = getConfig();
    const matchingConfigs = config.filter((c) => c.value === username);
    const aliases = getAliases();

    expect(await authFileExists(scratchOrgUsername), 'scratch org to be removed').to.be.false;
    expect(await authFileExists(username), 'devhub to be removed').to.be.false;
    expect(aliases, 'All aliases to be removed').to.be.empty;
    expect(matchingConfigs, 'All configs removed').to.be.empty;
  });

  it('should logout of selected environments', async () => {
    execCmd(`alias set ${devhubAlias}=${username}`, { ensureExitCode: 0 });
    execCmd(`config set target-org=${username} --global`, { ensureExitCode: 0 });
    execCmd('logout', { cli: 'sf', ensureExitCode: 0, answers: [' ', 'Y'] });

    const config = getConfig();
    const matchingConfigs = config.filter((c) => c.value === username);
    const aliases = getAliases();
    const matchingAliases = aliases.filter((a) => a.alias === devhubAlias);

    expect(await authFileExists(scratchOrgUsername)).to.be.true;
    expect(await authFileExists(username)).to.be.false;
    expect(aliases).to.not.be.empty;

    expect(matchingAliases, 'Selected aliases to be removed').to.be.empty;
    expect(matchingConfigs, 'Selected configs to be removed').to.be.empty;
  });

  it('should not do anything if the user does not confirm the selection', async () => {
    execCmd(`alias set ${devhubAlias}=${username}`, { ensureExitCode: 0 });
    execCmd(`config set target-org=${username} --global`, { ensureExitCode: 0 });
    execCmd('logout', { cli: 'sf', ensureExitCode: 0, answers: ['a', 'n'] });

    expect(await authFileExists(username)).to.be.true;
    expect(await authFileExists(scratchOrgUsername)).to.be.true;
    expect(getAliases()).to.deep.equal([
      { alias: devhubAlias, value: username },
      { alias: scratchOrgAlias, value: scratchOrgUsername },
    ]);
  });

  it('should logout of all environments when --no-prompt is provided', async () => {
    execCmd(`alias set MyAlias=${username}`, { ensureExitCode: 0 });
    execCmd(`config set target-org=${username} --global`, { ensureExitCode: 0 });
    execCmd('logout --no-prompt', { cli: 'sf', ensureExitCode: 0 });

    const config = getConfig();
    const matchingConfigs = config.filter((c) => c.value === username);
    const aliases = getAliases();

    expect(await authFileExists(scratchOrgUsername), 'scratch org to be removed').to.be.false;
    expect(await authFileExists(username), 'devhub to be removed').to.be.false;
    expect(aliases, 'All aliases to be removed').to.be.empty;
    expect(matchingConfigs, 'All configs removed').to.be.empty;
  });
});
