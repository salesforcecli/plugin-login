/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { execCmd, prepareForJwt, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Env } from '@salesforce/kit';
import { ensureString, JsonMap } from '@salesforce/ts-types';
import { readJson } from 'fs-extra';
import { Global } from '@salesforce/core';

let testSession: TestSession;

type OrgResult = {
  nonScratchOrgs: Array<{ username: string; alias: string }>;
};

describe('interoperability NUTs', () => {
  const env = new Env();

  const devhubAlias = 'devhub';
  let username: string;
  let instanceUrl: string;
  let clientId: string;
  let jwtKey: string;

  const readSfdxAuthInfo = async (uname: string): Promise<JsonMap> =>
    (await readJson(path.join(testSession.homeDir, Global.SFDX_STATE_FOLDER, `${uname}.json`))) as JsonMap;

  const sfdxAuthInfoExists = async (uname: string): Promise<boolean> => {
    try {
      await readSfdxAuthInfo(uname);
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
    });
  });

  after(async () => {
    await testSession?.clean();
  });

  describe('login', () => {
    beforeEach(async () => {
      jwtKey = prepareForJwt(testSession.homeDir);
    });

    afterEach(async () => {
      execCmd(`logout org -o ${username} --no-prompt`, { ensureExitCode: 0 });
    });

    it('should login with sf and be recognized by sfdx force:org:list', async () => {
      execCmd(
        `login org jwt -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --set-default-dev-hub --json`,
        { ensureExitCode: 0 }
      );

      const orgs = execCmd<OrgResult>('force:org:list --json', { ensureExitCode: 0, cli: 'sfdx' }).jsonOutput;
      expect(orgs.result.nonScratchOrgs[0].username).to.equal(username);
      expect(orgs.result.nonScratchOrgs[0].alias).to.equal(devhubAlias);
    });

    it('should login with sfdx and be recognized by sf env list', async () => {
      execCmd(`auth:jwt:grant -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -r ${instanceUrl} -d`, {
        cli: 'sfdx',
      });

      const envs = execCmd<{ salesforceOrgs: Array<{ username: string; aliases: string[] }> }>('env list --json', {
        ensureExitCode: 0,
      }).jsonOutput.result;

      expect(envs.salesforceOrgs[0].username).to.equal(username);
      expect(envs.salesforceOrgs[0].aliases).to.deep.equal([devhubAlias]);
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      jwtKey = prepareForJwt(testSession.homeDir);
    });

    it('should logout with sfdx after sf login', async () => {
      execCmd(
        `login org jwt -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --set-default-dev-hub --json`,
        { ensureExitCode: 0 }
      );
      execCmd(`auth:logout -p -u ${username}`, { cli: 'sfdx' });

      const envs = execCmd('env list --json', { ensureExitCode: 0 }).jsonOutput.result;
      expect(envs).to.be.empty;

      const authInfoExists = await sfdxAuthInfoExists(username);
      expect(authInfoExists).to.be.false;
    });

    it('should logout with sf after sfdx login', async () => {
      execCmd(`auth:jwt:grant -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -r ${instanceUrl} -d`, {
        cli: 'sfdx',
      });
      execCmd(`logout org -o ${username} --no-prompt`, { ensureExitCode: 0 });

      const orgs = execCmd<OrgResult>('force:org:list --json', { ensureExitCode: 0, cli: 'sfdx' }).jsonOutput;
      expect(orgs.result.nonScratchOrgs).to.be.empty;

      const authInfoExists = await sfdxAuthInfoExists(username);
      expect(authInfoExists).to.be.false;
    });
  });
});
