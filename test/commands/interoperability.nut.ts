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
import { fs, Global, GlobalInfo, SfInfo } from '@salesforce/core';
import { exec } from 'shelljs';

let testSession: TestSession;

type OrgResult = {
  status: number;
  result: {
    nonScratchOrgs: Array<{ username: string; alias: string }>;
  };
};

describe('interoperability NUTs', () => {
  const env = new Env();
  env.setString('TESTKIT_EXECUTABLE_PATH', path.join(process.cwd(), 'bin', 'dev'));

  const devhubAlias = 'devhub';
  let username: string;
  let instanceUrl: string;
  let clientId: string;
  let jwtKey: string;

  const readGlobalInfo = async (): Promise<SfInfo> => {
    return (await fs.readJson(
      path.join(testSession.homeDir, GlobalInfo.getDefaultOptions().stateFolder, GlobalInfo.getFileName())
    )) as SfInfo;
  };

  const readSfdxAuthInfo = async (uname: string): Promise<JsonMap> => {
    return (await fs.readJson(path.join(testSession.homeDir, Global.SFDX_STATE_FOLDER, `${uname}.json`))) as JsonMap;
  };

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
      authStrategy: 'NONE',
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
      execCmd(`logout org -o ${username} --no-prompt`, { cli: 'sf', ensureExitCode: 0 });
    });

    it('should login with sf and be recognized by sfdx force:org:list', async () => {
      execCmd(
        `login org jwt -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -l ${instanceUrl} --set-default-dev-hub --json`,
        { ensureExitCode: 0 }
      );

      const orgs = JSON.parse(exec('sfdx force:org:list --json', { silent: true })) as OrgResult;

      expect(orgs.result.nonScratchOrgs[0].username).to.equal(username);
      expect(orgs.result.nonScratchOrgs[0].alias).to.equal(devhubAlias);

      const info = await readGlobalInfo();
      const authInfo = await readSfdxAuthInfo(username);
      expect(authInfo.username).to.equal(info.orgs[username].username);
      expect(authInfo.accessToken).to.equal(info.orgs[username].accessToken);
      expect(authInfo.orgId).to.equal(info.orgs[username].orgId);
    });

    it('should login with sfdx and be recognized by sf env list', async () => {
      exec(`sfdx auth:jwt:grant -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -r ${instanceUrl} -d`, {
        silent: true,
      });

      const envs = execCmd<{ salesforceOrgs: Array<{ username: string; aliases: string[] }> }>('env list --json', {
        cli: 'sf',
        ensureExitCode: 0,
      }).jsonOutput.result;

      expect(envs.salesforceOrgs[0].username).to.equal(username);
      expect(envs.salesforceOrgs[0].aliases).to.deep.equal([devhubAlias]);

      const info = await readGlobalInfo();
      const authInfo = await readSfdxAuthInfo(username);
      expect(info.orgs[username].username).to.equal(authInfo.username);
      expect(info.orgs[username].accessToken).to.equal(authInfo.accessToken);
      expect(info.orgs[username].orgId).to.equal(authInfo.orgId);
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
      exec(`sfdx auth:logout -p -u ${username}`, { silent: true });

      const envs = execCmd('env list --json', { cli: 'sf', ensureExitCode: 0 }).jsonOutput.result;
      expect(envs).to.be.empty;

      const info = await readGlobalInfo();
      expect(info.orgs).to.not.have.property(username);

      const authInfoExists = await sfdxAuthInfoExists(username);
      expect(authInfoExists).to.be.false;
    });

    it('should logout with sf after sfdx login', async () => {
      exec(`sfdx auth:jwt:grant -u ${username} -a ${devhubAlias} -i ${clientId} -f ${jwtKey} -r ${instanceUrl} -d`, {
        silent: true,
      });
      execCmd(`logout org -o ${username} --no-prompt`, { ensureExitCode: 0, cli: 'sf' });

      const orgs = JSON.parse(exec('sfdx force:org:list --json', { silent: true })) as OrgResult;

      // Failure means that no orgs where found which is what we expect to happen
      expect(orgs.status).to.equal(1);

      const info = await readGlobalInfo();
      expect(info.orgs).to.not.have.property(username);

      const authInfoExists = await sfdxAuthInfoExists(username);
      expect(authInfoExists).to.be.false;
    });
  });
});
