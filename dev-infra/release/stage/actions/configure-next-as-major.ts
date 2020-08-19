/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ReleaseAction} from '../actions';

export class ConfigureNextAsMajorAction extends ReleaseAction {
  getDescription() {
    return `Configure the "${this._active.next.branchName}" branch to be released as major.`;
  }

  isValid(): boolean {
    // The next version branch can only be switched to a `major` if we previously branched
    // off for an FF/RC branch and temporarily incremented the `next` version to a minor.
    // See: https://hackmd.io/2Le8leq0S6G_R5VEVTNK9A#Move-next-into-feature-freeze
    const nextVersion = this._active.next.version;
    const isFirstNextPrerelease = nextVersion.prerelease[0] === 'next' &&
      nextVersion.prerelease[1] === 0;
    return nextVersion.minor !== 0 && isFirstNextPrerelease;
  }

  async perform() {}
}
