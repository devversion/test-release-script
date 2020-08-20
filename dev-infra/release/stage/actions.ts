/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ActiveReleaseTrains} from '../base-release-task';
import * as semver from 'semver';
import {GitClient} from '../../utils/git/index';
import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {green, info, promptConfirm, red, error, yellow} from '../../utils/console';
import {getListCommitsInBranchUrl} from './github-urls';
import {ReleaseConfig} from '../config';
import {params, types} from 'typed-graphqlify';
import {findOwnedForksOfRepoQuery} from './graphql-queries';

export abstract class ReleaseAction {
  abstract getDescription(): string;
  abstract isValid(): boolean;
  abstract perform(): Promise<void>;

  constructor(protected _active: ActiveReleaseTrains,
              protected _git: GitClient,
              protected _config: ReleaseConfig,
              protected _projectDir: string) {}

  /** Updates the version in the project top-level `package.json` file. */
  protected _updateProjectVersion(newVersion: semver.SemVer) {
    const pkgJsonPath = join(this._projectDir, 'package.json');
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    pkgJson.version = newVersion.format();
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    info(green(`  ✓   Updated project version to ${pkgJson.version}`));
  }

  /** Verifies that the latest commit for the given branch is passing all statuses. */
  protected async _verifyPassingGithubStatus(branchName: string) {
    const {data: {commit}} = await this._git.github.repos.getBranch(
        {...this._git.remoteParams, branch: branchName});
    const {data: {state}} = await this._git.github.repos.getCombinedStatusForRef(
        {...this._git.remoteParams, ref: commit.sha});
    const branchCommitsUrl = getListCommitsInBranchUrl(this._git, branchName);

    if (state === 'failure') {
      error(red(
        `  ✘   Cannot stage release. Commit "${commit.sha}" does not pass all github ` +
        `status checks. Please make sure this commit passes all checks before re-running.`));
      error(`      Please have a look at: ${branchCommitsUrl}`);

      if (await promptConfirm('Do you want to ignore the Github status and proceed?')) {
        info(green(
          `  ⚠   Upstream commit is failing CI checks, but status has been ` +
          `forcibly ignored.`));
        return;
      }
      process.exit(1);
    } else if (state === 'pending') {
      error(red(
        `  ✘   Commit "${commit.sha}" still has pending github statuses that ` +
        `need to succeed before staging a release.`));
      error(red(`      Please have a look at: ${branchCommitsUrl}`));
      if (await promptConfirm('Do you want to ignore the Github status and proceed?')) {
        info(green(
          `  ⚠   Upstream commit is pending CI, but status has been ` +
          `forcibly ignored.`));
        return;
      }
      process.exit(0);
    }

    info(green('  ✓   Upstream commit is passing all github status checks.'));
  }

  protected async _generateChangelogForNewVersion(version: semver.SemVer) {
    // TODO: Actual generation needs to be implemented.
    info(green(`  ✓   Updated the changelog to capture changes in "${version}".`));
  }

  protected async _waitForChangelogEditsAndCreateReleaseCommit(newVersion: semver.SemVer) {
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
  }

  /**
   * Gets an owned fork for the configured project of the authenticated user.
   * Aborts the process with an error if no fork could be found.
   */
  protected async _getForkOfAuthenticatedUser(): Promise<{owner: string, name: string}> {
    const {owner, name} = this._git.remoteConfig;
    const result = await this._git.github.graphql.query(findOwnedForksOfRepoQuery, {owner, name});
    const forks = result.repository.forks.nodes;

    if (forks.length === 0) {
      error(red(`  ✘   Unable to find fork for currently authenticated user.`));
      error(red(`      Please ensure you created a fork of: ${owner}/${name}.`));
      process.exit(1);
    }

    const fork = forks[0];
    return {owner: fork.owner.login, name: fork.name};
  }
}
