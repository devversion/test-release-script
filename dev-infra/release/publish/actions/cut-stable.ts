/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';

import {getLtsNpmDistTagOfMajor} from '../../../pr/merge/defaults/lts-branch';
import {ReleaseAction} from '../actions';
import {ActiveReleaseTrains} from '../index';

/**
 * Release action that cuts a stable version for the current release-train in the release
 * candidate phase. The pre-release release-candidate version label is removed.
 */
export class CutStableAction extends ReleaseAction {
  private _newVersion = this._computeNewVersion();

  async getDescription() {
    const newVersion = this._newVersion;
    return `Cut a stable release for the release-candidate branch (v${newVersion}).`;
  }

  async perform() {
    const {branchName} = this.active.releaseCandidate!;
    const newVersion = this._newVersion;
    const isMajor = newVersion.minor === 0 && newVersion.patch === 0;

    const {id} = await this.checkoutBranchAndStageVersion(newVersion, branchName);

    await this.waitForPullRequestToBeMerged(id);
    await this.buildAndPublish(newVersion, branchName, 'latest');

    // If a major version is published and becomes the "latest" release-train, we need to
    // set the LTS npm dist tag for the previous latest release-train (the current patch).
    if (isMajor) {
      const previousPatchVersion = this.active.latest.version;
      const ltsTagForPatch = getLtsNpmDistTagOfMajor(previousPatchVersion.major);
      await this.setNpmDistTagForPackages(ltsTagForPatch, previousPatchVersion);
    }

    await this.cherryPickChangelogIntoNextBranch(newVersion, branchName);
  }

  static async isActive(active: ActiveReleaseTrains) {
    // A stable version can be cut for an active release-train currently in the
    // release-candidate phase. Note: It is not possible to directly release from
    // feature-freeze phase into a stable version.
    return active.releaseCandidate !== null &&
        active.releaseCandidate.version.prerelease[0] === 'rc';
  }

  /** Gets the new stable version of the release candidate release-train. */
  private _computeNewVersion(): semver.SemVer {
    const {version} = this.active.releaseCandidate!;
    return semver.parse(`${version.major}.${version.minor}.${version.patch}`)!;
  }
}
