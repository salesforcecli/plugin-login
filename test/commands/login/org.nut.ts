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
import { exec } from 'shelljs';

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

let testSession: TestSession;

describe('env connect NUTs', () => {
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
      // We're not using testkit because we don't want to introduce dependencies from sfdx
      // This should eventually be replaced by the equivalent sf command
      exec(`sfdx auth:logout -p -u ${username}`, { silent: true });
    });

    // Skipping because we do not currently have the --json flag added to sf commands
    it.skip('should authorize a salesforce org using jwt (json)', () => {
      const command = `env connect -u ${username} -i ${clientId} -f ${jwtKey} -r ${instanceUrl} --json`;
      const json = execCmd<AuthFields>(command, { ensureExitCode: 0 }).jsonOutput;
      expectAccessTokenToExist(json.result);
      expectOrgIdToExist(json.result);
      expectUrlToExist(json.result, 'instanceUrl');
      expectUrlToExist(json.result, 'loginUrl');
      expect(json.result.privateKey).to.equal(join(testSession.homeDir, 'jwtKey'));
      expect(json.result.username).to.equal(username);
    });

    it('should authorize a salesforce org using jwt (human readable)', () => {
      const command = `env connect -u ${username} -i ${clientId} -f ${jwtKey} -r ${instanceUrl}`;
      const result = execCmd(command, { ensureExitCode: 0 });
      const output = getString(result, 'shellOutput.stdout');
      expect(output).to.include(`Successfully authorized ${username} with ID`);
    });
  });
});
