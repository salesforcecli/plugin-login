/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as open from 'open';

import { AuthInfo, OAuth2Options, SfdxError, WebOAuthServer } from '@salesforce/core';
import { Nullable } from '@salesforce/ts-types';

export type OrgWebFlowArgs = {
  loginUrl: Nullable<string>;
  browser: Nullable<string>;
};

export type OrgSideEffects = {
  alias: string;
  setDefault: boolean;
};

export async function executeOrgWebFlow(args: Partial<OrgWebFlowArgs> = {}): Promise<AuthInfo> {
  try {
    const oauthConfig: OAuth2Options = args.loginUrl ? { loginUrl: args.loginUrl } : {};
    const oauthServer = await WebOAuthServer.create({ oauthConfig });
    await oauthServer.start();
    const openOpts = args.browser ? { wait: false, app: { name: args.browser } } : { wait: false };
    await open(oauthServer.getAuthorizationUrl(), openOpts);
    const authInfo = await oauthServer.authorizeAndSave();
    return authInfo;
  } catch (err) {
    const error = err as Error;
    if (error.name === 'AuthCodeExchangeError') {
      const errMsg = `Invalid client credentials. Verify the OAuth client secret and ID. ${error.message}`;
      throw new SfdxError(errMsg, 'InvalidClientCredentials');
    }
    throw error;
  }
}

export async function handleSideEffects(authInfo: AuthInfo, sideEffects: OrgSideEffects): Promise<void> {
  if (sideEffects.alias) await authInfo.setAlias(sideEffects.alias);
  if (sideEffects.setDefault) await authInfo.setAsDefault({ defaultUsername: true });
}
