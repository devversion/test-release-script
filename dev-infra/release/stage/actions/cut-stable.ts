/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ReleaseAction} from '../actions';

export class CutStableAction extends ReleaseAction {
  getDescription() {
    const branchName = this._active.releaseCandidate!.branchName;
    return `Cut a stable release for the release-candidate branch (${branchName}).`;
  }

  isValid(): boolean {
    // A stable version can be cut for an active release-train currently in the
    // release-candidate phase. Note: It is not possible to directly release from
    // feature-freeze phase into a stable version.
    return this._active.releaseCandidate !== null &&
      this._active.releaseCandidate.version.prerelease[0] === 'rc';
  }

  async perform() {}
}
