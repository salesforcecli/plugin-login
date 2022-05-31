/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { AuthRemover, StateAggregator, SfOrg } from '@salesforce/core';
import { Deauthorizer, SfHook } from '@salesforce/sf-plugins-core';

class OrgDeauthorizer extends Deauthorizer<SfOrg> {
  private remover!: AuthRemover;

  public async find(): Promise<Record<string, SfOrg>> {
    this.remover = await AuthRemover.create();
    const stateAggregator = await StateAggregator.getInstance();
    const auths = this.remover.findAllAuths();
    for (const auth of Object.values(auths)) {
      const aliases = stateAggregator.aliases.getAll(auth.username);
      if (aliases) auth.aliases = aliases;
    }
    return auths;
  }

  public async remove(username: string): Promise<boolean> {
    try {
      await this.remover.removeAuth(username);
      return true;
    } catch {
      return false;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
const hook: SfHook.Logout = async function () {
  return new OrgDeauthorizer();
};

export default hook;
