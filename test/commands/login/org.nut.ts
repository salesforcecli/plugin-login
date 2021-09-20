/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { execCmd, TestSession, prepareForJwt } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Env } from '@salesforce/kit';
import { ensureString, getString } from '@salesforce/ts-types';
import { AuthFields, OrgConfigProperties } from '@salesforce/core';
import { LoginOrgJwtResult } from '../../../lib/commands/login/org/jwt';

type UrlKey = Extract<keyof AuthFields, 'instanceUrl' | 'loginUrl'>;

type AliasEntry = {
  alias: string;
  value: string;
};

type ConfigEntry = {
  [name: string]: string;
};

function expectOrgIdToExist(auth: AuthFields): void {
  expect(auth.orgId).to.exist;
  expect(auth.orgId.length).to.equal(18);
}

function expectUrlToExist(auth: AuthFields, urlKey: UrlKey): void {
  expect(auth[urlKey]).to.exist;
  expect(/^https*:\/\//.test(auth[urlKey])).to.be.true;
}

function expectAliasAndDefaults(username: string, alias: string, org: boolean, devHub: boolean): void {
  if (alias) {
    const aliases = execCmd<AliasEntry[]>('alias:list --json', { ensureExitCode: 0 }).jsonOutput.result;
    expect(aliases.some((entry) => entry.alias === alias && entry.value === username)).to.be.true;
  }

  const configs = execCmd<ConfigEntry[]>('config:list --json', { ensureExitCode: 0, cli: 'sf' }).jsonOutput.result;
  if (org) {
    expect(configs.some((entry) => entry.name === OrgConfigProperties.TARGET_ORG && entry.value === username)).to.be
      .true;
  } else {
    expect(configs.some((entry) => entry.name === OrgConfigProperties.TARGET_ORG && entry.value === username)).to.be
      .false;
  }
  if (devHub) {
    expect(configs.some((entry) => entry.name === OrgConfigProperties.TARGET_DEV_HUB && entry.value === username)).to.be
      .true;
  } else {
    expect(configs.some((entry) => entry.name === OrgConfigProperties.TARGET_DEV_HUB && entry.value === username)).to.be
      .false;
  }
}

let testSession: TestSession;

describe('login org NUTs', () => {
  const env = new Env();
  env.setString('TESTKIT_EXECUTABLE_PATH', path.join(process.cwd(), 'bin', 'dev'));
  describe('JWT to Salesforce orgs', () => {
    let jwtKey: string;
    let username: string;
    let instanceUrl: string;
    let clientId: string;

    before('prepare session and ensure environment variables', async () => {
      username = ensureString(env.getString('TESTKIT_HUB_USERNAME'));
      instanceUrl = ensureString(env.getString('TESTKIT_HUB_INSTANCE'));
      clientId = ensureString(env.getString('TESTKIT_JWT_CLIENT_ID'));
      ensureString(env.getString('TESTKIT_JWT_KEY'));

      testSession = await TestSession.create({ authStrategy: 'NONE' });
      jwtKey = prepareForJwt(testSession.homeDir);
    });

    after(async () => {
      await testSession?.clean();
    });

    afterEach(() => {
      const result = execCmd('logout --no-prompt', { cli: 'sf', ensureExitCode: 0 });
      expect(result.shellOutput.stdout).to.include(`You\'re now logged out of these environments: ${username}`);
    });

    it('should authorize a salesforce org using jwt (json)', () => {
      const command = `login org jwt -u ${username} -a foobarbaz -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --json`;
      const json = execCmd<LoginOrgJwtResult>(command, { cli: 'sf', ensureExitCode: 0 }).jsonOutput;

      expectOrgIdToExist(json.result);
      expectUrlToExist(json.result, 'instanceUrl');
      expectAliasAndDefaults(username, 'foobarbaz', false, false);
      expect(json.result.privateKey).to.equal(path.join(testSession.homeDir, 'jwtKey'));
      expect(json.result.username).to.equal(username);
    });

    it('should authorize a salesforce org using jwt (human readable)', () => {
      const command = `login org jwt -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { cli: 'sf', ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
      expectAliasAndDefaults(username, undefined, false, false);
    });

    it('should authorize a salesforce org using jwt (human readable) with alias', () => {
      const command = `login org jwt -a foobarbaz -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { cli: 'sf', ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
      expectAliasAndDefaults(username, 'foobarbaz', false, false);
    });

    it('should authorize a salesforce org using jwt (human readable) with default org', () => {
      const command = `login org jwt -d -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { cli: 'sf', ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
      expectAliasAndDefaults(username, undefined, true, false);
    });

    it('should authorize a salesforce org using jwt (human readable) with default devhub', () => {
      const command = `login org jwt -v -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { cli: 'sf', ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
      expectAliasAndDefaults(username, undefined, false, true);
    });
  });
});
