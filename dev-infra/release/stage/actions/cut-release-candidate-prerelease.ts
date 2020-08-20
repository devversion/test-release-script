/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ReleaseAction} from '../actions';

export class CutPrereleaseForReleaseCandidateAction extends ReleaseAction {
  getDescription() {
    const branchName = this._active.releaseCandidate!.branchName;
    const currentPhase = this._active.releaseCandidate!.version.prerelease[0] === 'next' ?
      'feature-freeze' : 'release-candidate';
    return `Cut a new next pre-release for the "${currentPhase}" branch (${branchName}).`;
  }

  isValid(): boolean {
    // New pre-releases can be cut if there is a release-can release-train currently in
    // feature-freeze or release-candidate phase.
    return this._active.releaseCandidate !== null;
  }

  async perform() {
  }
}
