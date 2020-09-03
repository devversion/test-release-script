/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {MoveNextIntoFeatureFreezeAction} from '../actions/move-next-into-feature-freeze';
import * as npm from '../npm-publish';

import {getChangelogForVersion, parse, setupReleaseActionForTesting, testTmpDir} from './test-utils';
import {getBranchPushMatcher} from './virtual-git-matchers';

describe('move next into feature-freeze action', () => {
  it('should not activate if a feature-freeze release-train is active', async () => {
    expect(await MoveNextIntoFeatureFreezeAction.isActive({
      releaseCandidate: {branchName: '10.1.x', version: parse('10.1.0-next.1')},
      next: {branchName: 'master', version: parse('10.2.0-next.0')},
      latest: {branchName: '10.0.x', version: parse('10.0.3')},
    })).toBe(false);
  });

  it('should not activate if release-candidate release-train is active', async () => {
    expect(await MoveNextIntoFeatureFreezeAction.isActive({
      // No longer in feature-freeze but in release-candidate phase.
      releaseCandidate: {branchName: '10.1.x', version: parse('10.1.0-rc.0')},
      next: {branchName: 'master', version: parse('10.2.0-next.0')},
      latest: {branchName: '10.0.x', version: parse('10.0.3')},
    })).toBe(false);
  });

  it('should activate if no FF/RC release-train is active', async () => {
    expect(await MoveNextIntoFeatureFreezeAction.isActive({
      releaseCandidate: null,
      next: {branchName: 'master', version: parse('10.1.0-next.0')},
      latest: {branchName: '10.0.x', version: parse('10.0.3')},
    })).toBe(true);
  });

  it('should create pull requests and feature-freeze branch', async () => {
    const {repo, fork, instance, gitClient, releaseConfig} =
        setupReleaseActionForTesting(MoveNextIntoFeatureFreezeAction, {
          releaseCandidate: null,
          next: {branchName: 'master', version: parse('10.2.0-next.0')},
          latest: {branchName: '10.0.x', version: parse('10.0.3')},
        });

    const expectedNextVersion = `10.3.0-next.0`;
    const expectedVersion = '10.2.0-next.1';
    const expectedNextUpdateBranch = `next-release-train-${expectedNextVersion}`;
    const expectedStagingForkBranch = `release-stage-${expectedVersion}`;
    const expectedTagName = expectedVersion;

    // We first mock the commit status check for the next branch, then expect two pull
    // requests from a fork that are targeting next and the new feature-freeze branch.
    repo.expectBranchRequest('master', 'MASTER_COMMIT_SHA')
        .expectCommitStatusCheck('MASTER_COMMIT_SHA', 'success')
        .expectFindForkRequest(fork)
        .expectPullRequestToBeCreated('10.2.x', fork, expectedStagingForkBranch, 200)
        .expectPullRequestWait(200)
        .expectBranchRequest('10.2.x', 'STAGING_COMMIT_SHA')
        .expectCommitRequest(
            'STAGING_COMMIT_SHA', `release: cut the v${expectedVersion} release\n\nPR Close #200.`)
        .expectTagToBeCreated(expectedTagName, 'STAGING_COMMIT_SHA')
        .expectReleaseToBeCreated(`v${expectedVersion}`, expectedTagName)
        .expectChangelogFetch('10.2.x', getChangelogForVersion(expectedVersion))
        .expectPullRequestToBeCreated('master', fork, expectedNextUpdateBranch, 100);

    // In the fork, we make the following branches appear as non-existent,
    // so that the PRs can be created properly without collisions.
    fork.expectBranchRequest(expectedStagingForkBranch, null)
        .expectBranchRequest(expectedNextUpdateBranch, null);

    await instance.perform();

    expect(gitClient.pushed.length).toBe(3);
    expect(gitClient.pushed[0])
        .toEqual(
            getBranchPushMatcher({
              baseRepo: repo,
              baseBranch: 'master',
              targetRepo: repo,
              targetBranch: '10.2.x',
              expectedCommits: [],
            }),
            'Expected feature-freeze branch to be created upstream and based on "master".');
    expect(gitClient.pushed[1])
        .toEqual(
            getBranchPushMatcher({
              baseBranch: 'master',
              baseRepo: repo,
              targetBranch: expectedStagingForkBranch,
              targetRepo: fork,
              expectedCommits: [{
                message: `release: cut the v${expectedVersion} release`,
                files: ['package.json', 'CHANGELOG.md'],
              }],
            }),
            'Expected release staging branch to be created in fork.');

    expect(gitClient.pushed[2])
        .toEqual(
            getBranchPushMatcher({
              baseBranch: 'master',
              baseRepo: repo,
              targetBranch: expectedNextUpdateBranch,
              targetRepo: fork,
              expectedCommits: [
                {
                  message: `release: bump the next branch to v10.3.0-next.0`,
                  files: ['package.json']
                },
                {
                  message: `docs: release notes for the v10.2.0-next.1 release`,
                  files: ['CHANGELOG.md']
                },
              ],
            }),
            'Expected next release-train update branch be created in fork.');

    expect(releaseConfig.buildPackages).toHaveBeenCalledTimes(1);
    expect(releaseConfig.generateReleaseNotesForHead).toHaveBeenCalledTimes(1);
    expect(npm.runNpmPublish).toHaveBeenCalledTimes(2);
    expect(npm.runNpmPublish).toHaveBeenCalledWith(`${testTmpDir}/dist/pkg1`, 'next', undefined);
    expect(npm.runNpmPublish).toHaveBeenCalledWith(`${testTmpDir}/dist/pkg2`, 'next', undefined);
  }
});
