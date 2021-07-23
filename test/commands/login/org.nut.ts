/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'path';
import { execCmd, TestSession, prepareForJwt } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Env } from '@salesforce/kit';
import { ensureString, getString } from '@salesforce/ts-types';
import { AuthFields } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { exec, ShellString } from 'shelljs';

export type Result<T> = {
  status: number;
  result: T & AnyJson;
};

export type ErrorResult = {
  status: number;
  name: string;
  message: string;
};

type UrlKey = Extract<keyof AuthFields, 'instanceUrl' | 'loginUrl'>;

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
  let results: ShellString = exec('sfdx force:alias:list', { silent: true });
  if (results.code !== 0) {
    throw new Error('sfdx force:alias:list command failed. ' + results.stderr);
  }
  if (alias) {
    expect(results.stdout).to.include(username);
    expect(results.stdout).to.include(alias);
  }

  results = exec('sfdx force:config:list', { silent: true });
  if (results.code !== 0) {
    throw new Error('sfdx force:alias:list command failed' + results.stderr);
  }
  const defaultusernameRegExp = new RegExp(`defaultusername.*${username}`);
  if (defaultUserName) {
    expect(results.stdout).to.match(defaultusernameRegExp);
  } else {
    expect(results.stdout).to.not.match(defaultusernameRegExp);
  }
  const defaultDevHubUsernameRegExp = new RegExp(`defaultdevhubusername.*${username}`);
  if (defaultDevHubUsername) {
    expect(results.stdout).to.match(defaultDevHubUsernameRegExp);
  } else {
    expect(results.stdout).to.not.match(defaultDevHubUsernameRegExp);
  }
}
let testSession: TestSession;

describe('login org NUTs', () => {
  const env = new Env();

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
      const result = execCmd('logout --noprompt', { ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include('You are now logged out of all environments.');
    });

    it('should authorize a salesforce org using jwt (json)', () => {
      const command = `login org jwt -u ${username} -a foobarbaz -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --json`;
      const json = execCmd<AuthFields>(command, { ensureExitCode: 0 }).jsonOutput as AuthFields;
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
      const result = execCmd(command, { ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
    });
    it('should authorize a salesforce org using jwt (human readable) with alias', () => {
      const command = `login org jwt  -a foobarbaz -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
    });
    it('should authorize a salesforce org using jwt (human readable) with defaultusername', () => {
      const command = `login org jwt -d -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
    });
    it('should authorize a salesforce org using jwt (human readable) with defaultdevhubusername', () => {
      const command = `login org jwt -v -u ${username} -i ${clientId} -f ${jwtKey} -l ${instanceUrl}`;
      const result = execCmd(command, { ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
    });
  });
});
