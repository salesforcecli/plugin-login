/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'path';
import * as path from 'path';
import { execCmd, TestSession, prepareForJwt } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Env } from '@salesforce/kit';
import { ensureString, getString } from '@salesforce/ts-types';
import { AuthFields } from '@salesforce/core';

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

function expectAccessTokenToExist(auth: AuthFields): void {
  expect(auth.accessToken).to.exist;
  expect(auth.accessToken.startsWith(auth.orgId.substr(0, 15))).to.be.true;
}

function expectAliasAndDefaults(
  username: string,
  alias: string,
  defaultUserName: boolean,
  defaultDevHubUsername: boolean
): void {
  if (alias) {
    const aliases: AliasEntry[] = execCmd('alias:list --json', { ensureExitCode: 0 }).jsonOutput
      .result as unknown as AliasEntry[];
    expect(aliases.some((entry) => entry.alias === alias && entry.value === username)).to.be.true;
  }

  const configs = execCmd('config:list --json', { ensureExitCode: 0 }).jsonOutput.result as unknown as ConfigEntry[];
  if (defaultUserName) {
    expect(configs.some((entry) => entry.key === 'defaultusername' && entry.value === username)).to.be.true;
  } else {
    expect(configs.some((entry) => entry.key === 'defaultusername' && entry.value === username)).to.be.false;
  }
  if (defaultDevHubUsername) {
    expect(configs.some((entry) => entry.key === 'defaultdevhubusername' && entry.value === username)).to.be.true;
  } else {
    expect(configs.some((entry) => entry.key === 'defaultdevhubusername' && entry.value === username)).to.be.false;
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
      const result = execCmd('logout --noprompt', { cli: 'sf', ensureExitCode: 0 });
      expect(result.shellOutput.stdout).to.include('You are now logged out of all environments.');
    });

    it('should authorize a salesforce org using jwt (json)', () => {
      const command = `login org jwt -u ${username} -a foobarbaz -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --json`;
      const json = execCmd<AuthFields>(command, { cli: 'sf', ensureExitCode: 0 }).jsonOutput;
      expectAccessTokenToExist(json);
      expectOrgIdToExist(json);
      expectUrlToExist(json, 'instanceUrl');
      expectUrlToExist(json, 'loginUrl');
      expectAliasAndDefaults(username, 'foobarbaz', false, false);
      expect(json.privateKey).to.equal(join(testSession.homeDir, 'jwtKey'));
      expect(json.username).to.equal(username);
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
    it('should authorize a salesforce org using jwt (human readable) with defaultusername', () => {
      const command = `login org jwt -d -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { cli: 'sf', ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
      expectAliasAndDefaults(username, undefined, true, false);
    });
    it('should authorize a salesforce org using jwt (human readable) with defaultdevhubusername', () => {
      const command = `login org jwt -v -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { cli: 'sf', ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
      expectAliasAndDefaults(username, undefined, false, true);
    });
  });
});
