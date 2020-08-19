/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';
import {ReleaseAction} from '../actions';
import {green, info, promptConfirm, yellow} from '../../../utils/console';

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
    this._generateChangelogForNewVersion(newVersion);

    info(yellow(
      `  ⚠   Please review the changelog and ensure that the log contains only changes ` +
      `that apply to the public API surface. Manual changes can be made. When done, please ` +
      `proceed to the prompt below.`));

    if (!await promptConfirm('Do you want to proceed and commit the changes?')) {
      info(yellow('Aborting staging for release candidate.'));
      process.exit(0);
    }

    // Stage all changes that have been made (changelog and version bump).
    this._git.run(['add', '-A']);
    // Create a release staging commit including changelog and version bump.
    this._git.run(['commit', '--no-verify', '-m',
      this._config.releaseCommitMessage(newVersion)]);

    info();
    info(green(`  ✓   Created release commit for: "${newVersion}".`));
    info(green(`  ✓   Please push the changes and submit a PR on GitHub.`));
  }
}
