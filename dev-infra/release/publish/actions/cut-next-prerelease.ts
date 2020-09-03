/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';

import {ReleaseConfig} from '../../config/index';
import {isVersionPublishedToNpm} from '../../versioning/npm-registry';
import {ActiveReleaseTrains, ReleaseTrain} from '../../versioning/release-trains';
import {ReleaseAction} from '../actions';
import {semverInc} from '../inc-semver';

/**
 * Release action that cuts a prerelease for the next branch. A version in the next
 * branch can have an arbitrary amount of next pre-releases.
 */
export class CutNextPrereleaseAction extends ReleaseAction {
  /** Promise resolving with the new version if a NPM next pre-release is cut. */
  private _newVersion: Promise<semver.SemVer> = this._computeNewVersion();

  async getDescription() {
    const {branchName} = this._getActivePrereleaseTrain();
    const newVersion = await this._newVersion;
    return `Cut a new next pre-release for the "${branchName}" branch (v${newVersion}).`;
  }

  async perform() {
    const releaseTrain = this._getActivePrereleaseTrain();
    const {branchName} = releaseTrain;
    const newVersion = await this._newVersion;

    const {id} = await this.checkoutBranchAndStageVersion(newVersion, branchName);

    await this.waitForPullRequestToBeMerged(id);
    await this.buildAndPublish(newVersion, branchName, 'next');

    // If the pre-release has been cut from a branch that is not corresponding
    // to the next release-train, cherry-pick the changelog into the primary
    // development branch. i.e. the `next` branch that is usually `master`.
    if (releaseTrain !== this.active.next) {
      await this.cherryPickChangelogIntoNextBranch(newVersion, branchName);
    }
  }

  /** Gets the release train for which NPM next pre-releases should be cut. */
  private _getActivePrereleaseTrain(): ReleaseTrain {
    return this.active.releaseCandidate ?? this.active.next;
  }

  /** Gets the new pre-release version for this release action. */
  private async _computeNewVersion(): Promise<semver.SemVer> {
    const releaseTrain = this._getActivePrereleaseTrain();
    // If a pre-release is cut for the next release-train, the new version is computed
    // with respect to special cases surfacing with FF/RC branches. Otherwise, the basic
    // pre-release increment of the version is used as new version.
    if (releaseTrain === this.active.next) {
      return await computeNewVersionForNext(this.active, this.config);
    } else {
      return semverInc(releaseTrain.version, 'prerelease');
    }
  }

  static async isActive() {
    // Pre-releases for the `next` NPM dist tag can always be cut. Depending on whether
    // there is a feature-freeze/release-candidate branch, the next pre-releases are either
    // cut from such a branch, or from the actual `next` release-train branch (i.e. master).
    return true;
  }
}

/** Computes the new pre-release version for the next release-train. */
export async function computeNewVersionForNext(
    active: ActiveReleaseTrains, config: ReleaseConfig): Promise<semver.SemVer> {
  const {version: nextVersion} = active.next;
  const isNextPublishedToNpm = await isVersionPublishedToNpm(nextVersion, config);
  // Special-case where the version in the `next` release-train is not published yet. This
  // happens when we recently branched off for feature-freeze. We already bump the version to
  // the next minor or major, but do not publish immediately. Cutting a release immediately would
  // be not helpful as there are no other changes than in the feature-freeze branch. If we happen
  // to detect this case, we stage the release as usual but do not increment the version.
  if (isNextPublishedToNpm) {
    return semverInc(nextVersion, 'prerelease');
  } else {
    return nextVersion;
  }
}
