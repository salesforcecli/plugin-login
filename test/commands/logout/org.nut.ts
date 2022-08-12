/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as fs from 'fs';
import * as path from 'path';
import { execCmd, prepareForJwt, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Env } from '@salesforce/kit';
import { ensureString } from '@salesforce/ts-types';
import { Global } from '@salesforce/core';

let testSession: TestSession;

describe('logout org NUTs', () => {
  const env = new Env();
  env.setString('TESTKIT_EXECUTABLE_PATH', path.join(process.cwd(), 'bin', 'dev'));

  const devhubAlias = 'devhub';
  let username: string;
  let instanceUrl: string;
  let clientId: string;
  let jwtKey: string;

  const getConfig = (): Array<Record<string, string>> =>
    execCmd<Array<Record<string, string>>>('config list --json', { cli: 'sf' }).jsonOutput.result;

  const getAliases = (): Array<Record<string, string>> =>
    execCmd<Array<Record<string, string>>>('alias list --json', { cli: 'sf' }).jsonOutput.result;

  const authFileExists = async (uname: string): Promise<boolean> => {
    try {
      await fs.promises.access(path.join(testSession.homeDir, Global.STATE_FOLDER, `${uname}.json`));
      return true;
    } catch {
      return false;
    }
  };

  before('prepare session and ensure environment variables', async () => {
    username = ensureString(env.getString('TESTKIT_HUB_USERNAME'));
    instanceUrl = ensureString(env.getString('TESTKIT_HUB_INSTANCE'));
    clientId = ensureString(env.getString('TESTKIT_JWT_CLIENT_ID'));
    ensureString(env.getString('TESTKIT_JWT_KEY'));

    testSession = await TestSession.create({
      project: { name: 'logoutOrgNUTs' },
      authStrategy: 'NONE',
    });
  });

  beforeEach(async () => {
    jwtKey = prepareForJwt(testSession.homeDir);
    execCmd(
      `login org jwt -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --set-default-dev-hub --json`,
      { ensureExitCode: 0 }
    );
  });

  after(async () => {
    await testSession?.clean();
  });

  (process.platform !== 'win32' ? it : it.skip)('should logout of specified org username with prompt', async () => {
    execCmd(`logout org -o ${username}`, { cli: 'sf', ensureExitCode: 0, answers: ['Y'] });
    const config = getConfig();
    const matchingConfigs = config.filter((c) => [username, devhubAlias].includes(c.value));
    const aliases = getAliases();
    const matchingAliases = aliases.filter((a) => a.alias === devhubAlias);

    expect(await authFileExists(username)).to.be.false;
    expect(matchingAliases, 'aliases to be removed').to.be.empty;
    expect(matchingConfigs, 'configs to be removed').to.be.empty;
  });

  (process.platform !== 'win32' ? it : it.skip)('should logout of specified org alias with prompt', async () => {
    execCmd(`logout org -o ${devhubAlias}`, { cli: 'sf', ensureExitCode: 0, answers: ['Y'] });
    const config = getConfig();
    const matchingConfigs = config.filter((c) => [username, devhubAlias].includes(c.value));
    const aliases = getAliases();
    const matchingAliases = aliases.filter((a) => a.alias === devhubAlias);

    expect(await authFileExists(username)).to.be.false;
    expect(matchingAliases, 'aliases to be removed').to.be.empty;
    expect(matchingConfigs, 'configs to be removed').to.be.empty;
  });

  it('should logout of specified org username without prompt', async () => {
    execCmd(`logout org -o ${username} --no-prompt`, { cli: 'sf', ensureExitCode: 0 });
    const config = getConfig();
    const matchingConfigs = config.filter((c) => [username, devhubAlias].includes(c.value));
    const aliases = getAliases();
    const matchingAliases = aliases.filter((a) => a.alias === devhubAlias);

    expect(await authFileExists(username)).to.be.false;
    expect(matchingAliases, 'aliases to be removed').to.be.empty;
    expect(matchingConfigs, 'configs to be removed').to.be.empty;
  });

  it('should logout of specified org alias without prompt', async () => {
    execCmd(`logout org -o ${devhubAlias} --no-prompt`, { cli: 'sf', ensureExitCode: 0 });
    const config = getConfig();
    const matchingConfigs = config.filter((c) => [username, devhubAlias].includes(c.value));
    const aliases = getAliases();
    const matchingAliases = aliases.filter((a) => a.alias === devhubAlias);

    expect(await authFileExists(username)).to.be.false;
    expect(matchingAliases, 'aliases to be removed').to.be.empty;
    expect(matchingConfigs, 'configs to be removed').to.be.empty;
  });

  (process.platform !== 'win32' ? it : it.skip)('should do nothing if logout is not confirmed', async () => {
    execCmd(`logout org -o ${devhubAlias}`, { cli: 'sf', ensureExitCode: 0, answers: ['n'] });
    const config = getConfig();
    const matchingConfigs = config.filter((c) => [username, devhubAlias].includes(c.value));
    const aliases = getAliases();
    const matchingAliases = aliases.filter((a) => a.alias === devhubAlias);

    expect(await authFileExists(username)).to.be.true;
    expect(matchingAliases).to.not.be.empty;
    expect(matchingConfigs).to.not.be.empty;
  });
});
