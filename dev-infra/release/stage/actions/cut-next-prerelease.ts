/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ReleaseAction} from '../actions';

export class CutNextPrereleaseAction extends ReleaseAction {
  getDescription() {
    return `Cut a new next pre-release for the "${this._active.next.branchName}" branch.`;
  }

  isValid(): boolean {
    // We do not allow pre-releases for the `next` release-train if there is an active
    // release-train in feature-freeze/release-candidate phase. This is necessary because
    // we already cut pre-releases to the `next` NPM dist-tag from the FF/RC branch.
    return this._active.releaseCandidate === null;
  }
  async perform() {}
}
