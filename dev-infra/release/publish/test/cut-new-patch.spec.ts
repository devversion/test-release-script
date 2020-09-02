/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CutNewPatchAction} from '../actions/cut-new-patch';
import {expectStagingAndPublishWithCherryPick, parse, setupReleaseActionForTesting} from './test-utils';

describe('cut new patch action', () => {
  it('should be active', async () => {
    expect(await CutNewPatchAction.isActive({
      releaseCandidate: null,
      next: {branchName: 'master', version: parse('10.1.0-next.3')},
      latest: {branchName: '10.0.x', version: parse('10.0.3')},
    })).toBe(true);
  });

  it('should compute proper new version and select correct branch', async () => {
    const action = setupReleaseActionForTesting(CutNewPatchAction, {
      releaseCandidate: null,
      next: {branchName: 'master', version: parse('10.1.0-next.3')},
      latest: {branchName: '10.0.x', version: parse('10.0.2')},
    });

    await expectStagingAndPublishWithCherryPick(action, '10.0.x', '10.0.3', 'latest');
  });

  it('should create a proper new version if there is a feature-freeze release-train', async () => {
    const action = setupReleaseActionForTesting(CutNewPatchAction, {
      releaseCandidate: {branchName: '10.1.x', version: parse('10.1.0-next.3')},
      next: {branchName: 'master', version: parse('10.2.0-next.0')},
      latest: {branchName: '10.0.x', version: parse('10.0.9')},
    });

    await expectStagingAndPublishWithCherryPick(action, '10.0.x', '10.0.10', 'latest');
  });

  it('should create a proper new version if there is a release-candidate train', async () => {
    const action = setupReleaseActionForTesting(CutNewPatchAction, {
      releaseCandidate: {branchName: '10.1.x', version: parse('10.1.0-rc.0')},
      next: {branchName: 'master', version: parse('10.2.0-next.0')},
      latest: {branchName: '10.0.x', version: parse('10.0.9')},
    });

    await expectStagingAndPublishWithCherryPick(action, '10.0.x', '10.0.10', 'latest');
  });
});
