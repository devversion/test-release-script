/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';

import {error, green, info, yellow} from '../../../utils/console';
import {ReleaseAction} from '../actions';
import {getCommitMessageForExceptionalNextVersionBump} from '../commit-message';
import {packageJsonPath} from '../constants';
import {semverInc} from '../inc-semver';
import {ActiveReleaseTrains} from '../index';

/**
 * Release action that moves the next release-train into the feature-freeze phase. This means
 * that a new version branch is created from the next branch, and a new next pre-release is
 * cut indicating the started feature-freeze.
 */
export class MoveNextIntoFeatureFreezeAction extends ReleaseAction {
  private _newVersion = semverInc(this.active.next.version, 'prerelease');
  private _newBranch = `${this._newVersion.major}.${this._newVersion.minor}.x`;

  async getDescription() {
    const {branchName} = this.active.next;
    const newVersion = this._newVersion;
    return `Move the "${branchName}" branch into feature-freeze phase (v${newVersion}).`;
  }

  async perform() {
    // Branch-off the next branch into a feature-freeze branch.
    await this._createNewVersionBranchFromNext();

    // Stage the new version for the newly created branch, and push changes to a
    // fork in order to create a staging pull request. Note that we re-use the newly
    // created branch instead of re-fetching from the upstream.
    const stagingPullRequest =
        await this.stageVersionForBranchAndCreatePullRequest(this._newVersion, this._newBranch);

    // Wait for the staging PR to be merged. Then build and publish the feature-freeze next
    // release and cherry-pick the release notes into the next branch in combination with
    // bump ing the version to the next minor too.
    await this.waitForPullRequestToBeMerged(stagingPullRequest.id);
    await this.buildAndPublish(this._newVersion, this._newBranch, 'next');
    await this._createNextBranchUpdatePullRequest();
  }

  /** Creates a new version branch from the next branch. */
  private async _createNewVersionBranchFromNext() {
    const {branchName: nextBranch} = this.active.next;
    await this.verifyPassingGithubStatus(nextBranch);
    await this.checkoutUpstreamBranch(nextBranch);
    await this.createLocalBranchFromHead(this._newBranch);
    await this.pushHeadToRemoteBranch(this._newBranch);
    info(green(`  ✓   Version branch "${this._newBranch}" created.`));
  }

  /**
   * Creates a pull request for the next branch that bumps the version to the next
   * minor, and cherry-picks the changelog for the newly branched-off feature-freeze version.
   */
  private async _createNextBranchUpdatePullRequest() {
    const {branchName: nextBranch, version} = this.active.next;
    // We increase the version for the next branch to the next minor. The team can decide
    // later if they want next to be a major through the `Configure Next as Major` release action.
    const newNextVersion = semver.parse(`${version.major}.${version.minor + 1}.0-next.0`)!;
    const bumpCommitMessage = getCommitMessageForExceptionalNextVersionBump(newNextVersion);

    await this.checkoutUpstreamBranch(nextBranch);
    await this.updateProjectVersion(newNextVersion);

    // Create an individual commit for the next version bump. The changelog should go into
    // a separate commit that makes it clear where the changelog is cherry-picked from.
    await this.createCommit(bumpCommitMessage, [packageJsonPath]);

    let nextPullRequestMessage = `The previous "next" release-train has moved into the ` +
        `release-candidate phase. This PR updates the next branch to the subsequent ` +
        `release-train.`;
    const hasChangelogCherryPicked =
        await this.createCherryPickReleaseNotesCommit(this._newVersion, this._newBranch);

    if (hasChangelogCherryPicked) {
      nextPullRequestMessage += `\n\nAlso this PR cherry-picks the changelog for ` +
          `v${this._newVersion} into the ${nextBranch} branch so that the changelog is up to date.`;
    } else {
      error(yellow(`  ✘   Could not cherry-pick release notes for v${this._newVersion}.`));
      error(yellow(`      Please copy the release note manually into "${nextBranch}".`));
    }

    const nextUpdatePullRequest = await this.pushChangesToForkAndCreatePullRequest(
        nextBranch, `next-release-train-${newNextVersion}`,
        `Update next branch to reflect new release-train "v${newNextVersion}".`,
        nextPullRequestMessage);

    info(green(`  ✓   Pull request for updating the "${nextBranch}" branch has been created.`));
    info(yellow(`      Please ask team members to review: ${nextUpdatePullRequest.url}.`));
  }

  static async isActive(active: ActiveReleaseTrains) {
    // A new feature-freeze/release-candidate branch can only be created if there
    // is no active release-train in feature-freeze/release-candidate phase.
    return active.releaseCandidate === null;
  }
}
