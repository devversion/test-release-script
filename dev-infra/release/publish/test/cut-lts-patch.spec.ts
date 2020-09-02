/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CutLongTermSupportPatchAction} from '../actions/cut-lts-patch';

import {expectStagingAndPublishWithCherryPick, fakeNpmPackageQueryRequest, matchesVersion, parse, setupReleaseActionForTesting} from './test-utils';

describe('cut a LTS patch action', () => {
  it('should be active', async () => {
    expect(await CutLongTermSupportPatchAction.isActive({
      releaseCandidate: null,
      next: {branchName: 'master', version: parse('10.1.0-next.3')},
      latest: {branchName: '10.0.x', version: parse('10.0.3')},
    })).toBe(true);
  });

  it('should be active if there is a feature-freeze train', async () => {
    expect(await CutLongTermSupportPatchAction.isActive({
      releaseCandidate: {branchName: '10.1.x', version: parse('10.1.0-next.3')},
      next: {branchName: 'master', version: parse('10.2.0-next.3')},
      latest: {branchName: '10.0.x', version: parse('10.0.3')},
    })).toBe(true);
  });

  it('should be active if there is a release-candidate train', async () => {
    expect(await CutLongTermSupportPatchAction.isActive({
      releaseCandidate: {branchName: '10.1.x', version: parse('10.1.0-rc.0')},
      next: {branchName: 'master', version: parse('10.2.0-next.3')},
      latest: {branchName: '10.0.x', version: parse('10.0.3')},
    })).toBe(true);
  });

  it('should compute proper new version and select correct branch', async () => {
    const action = setupReleaseActionForTesting(CutLongTermSupportPatchAction, {
      releaseCandidate: null,
      next: {branchName: 'master', version: parse('10.1.0-next.3')},
      latest: {branchName: '10.0.x', version: parse('10.0.2')},
    });

    spyOn<any>(action.instance, '_promptForTargetLtsBranch')
        .and.resolveTo({name: '9.2.x', version: parse('9.2.4'), npmDistTag: 'v9-lts'});

    await expectStagingAndPublishWithCherryPick(action, '9.2.x', '9.2.5', 'v9-lts');
  });

  it('should properly determine active and inactive LTS branches', async () => {
    const action = setupReleaseActionForTesting(CutLongTermSupportPatchAction, {
      releaseCandidate: null,
      next: {branchName: 'master', version: parse('10.1.0-next.3')},
      latest: {branchName: '10.0.x', version: parse('10.0.2')},
    });

    fakeNpmPackageQueryRequest({
      'dist-tags': {
        'v9-lts': '9.2.3',
        'v8-lts': '8.4.4',
        'v7-lts': '7.0.1',
        'v6-lts': '6.0.0',
      },
      'time': {
        '9.0.0': new Date(),
        '8.0.0': new Date(),
        // We pick dates for the v6 and v7 major versions that guarantee that the version
        // is no longer considered as active LTS version.
        '7.0.0': new Date(1912, 5, 23),
        '6.0.0': new Date(1912, 5, 23)
      }
    });

    // Note: This accesses a private method, so we need to use an element access to satisfy
    // TypeScript. It is acceptable to access the member for fine-grained unit testing due to
    // complexity with inquirer we want to avoid. It is not easy to test prompts.
    const {active, inactive} = await action.instance['_findLongTermSupportBranchesFromNpm']();

    expect(active).toEqual([
      {name: '9.2.x', version: matchesVersion('9.2.3'), npmDistTag: 'v9-lts'},
      {name: '8.4.x', version: matchesVersion('8.4.4'), npmDistTag: 'v8-lts'},
    ]);
    expect(inactive).toEqual([
      {name: '7.0.x', version: matchesVersion('7.0.1'), npmDistTag: 'v7-lts'},
      {name: '6.0.x', version: matchesVersion('6.0.0'), npmDistTag: 'v6-lts'},
    ]);
  });
});
