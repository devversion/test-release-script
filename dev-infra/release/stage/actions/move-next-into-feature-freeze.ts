/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';
import {ReleaseAction} from '../actions';

export class MoveNextIntoFeatureFreezeAction extends ReleaseAction {
  getDescription() {
    return `Move the "${this._active.next.branchName}" branch into feature-freeze phase.`;
  }

  isValid(): boolean {
    // A new feature-freeze/release-candidate branch can only be created if there
    // is no active release-train in feature-freeze/release-candidate phase.
    return this._active.releaseCandidate === null;
  }

  /** Gets the feature-freeze branch name for the given version. */
  private _getFeatureFreezeBranchName(version: semver.SemVer) {
    return `${version.major}.${version.minor}.x`;
  }

  async perform() {}
}
