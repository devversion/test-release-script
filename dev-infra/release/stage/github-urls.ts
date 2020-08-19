/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GitClient} from '../../utils/git/index';

/** Gets a Github URL that refers to a lists of recent commits within a specified branch. */
export function getListCommitsInBranchUrl({remoteParams}: GitClient, branchName: string) {
  return `https://github.com/${remoteParams.owner}/${remoteParams.repo}/commits/${branchName}`;
}
