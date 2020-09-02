/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {spawnSync} from 'child_process';
import * as semver from 'semver';

/**
 * Runs NPM publish within a specified package directory. The captured output
 * of the NPM publish command is printed to the current console.
 * @returns A boolean indicating success or failures.
 */
export function runNpmPublish(packagePath: string, distTag: string): boolean {
  const result = spawnSync('npm', ['publish', '--access', 'public', '--tag', distTag], {
    cwd: packagePath,
    shell: true,
    stdio: 'inherit',
  });
  return result.status === 0;
}

/**
 * Sets the NPM tag to the specified version for the given package. The captured
 * output of the NPM command is printed to the current console.
 * @returns A boolean indicating success or failures.
 */
export function setNpmTagForPackage(packageName: string, distTag: string, version: semver.SemVer) {
  const result = spawnSync('npm', ['dist-tag', 'add', `${packageName}:${version}`, distTag], {
    shell: true,
    stdio: 'inherit',
  });
  return result.status === 0;
}
