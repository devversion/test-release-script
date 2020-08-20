/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';
import {ReleaseAction} from '../actions';

export class CutReleaseCandidateAction extends ReleaseAction {
  getDescription() {
    const branchName = this._active.releaseCandidate!.branchName;
    return `Cut a first release-candidate for the feature-freeze branch (${branchName}).`;
  }

  isValid(): boolean {
    // A release-candidate can be cut for an active release-train currently
    // in the feature-freeze phase.
    return this._active.releaseCandidate !== null &&
      this._active.releaseCandidate.version.prerelease[0] === 'next';
  }

  async perform() {
    const {branchName, version} = this._active.releaseCandidate!;
    const newVersion = semver.parse(`${version.major}.${version.minor}.0-rc.0`)!;

    await this._verifyPassingGithubStatus(branchName);

    this._git.run(['fetch', this._git.repoGitUrl, branchName]);
    this._git.run(['checkout', 'FETCH_HEAD', '--detach']);

    this._updateProjectVersion(newVersion);
    await this._generateChangelogForNewVersion(newVersion);
    await this._waitForChangelogEditsAndCreateReleaseCommit(newVersion);
   // this._pushCurrentBranchUpstream(`release-stage-${newVersion}`);
    console.error(await this._getForkOfAuthenticatedUser());

  //  this._git.github.getCurrentUser();
  }
}
