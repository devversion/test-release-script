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
export function runNpmPublish(
    packagePath: string, distTag: string, registryUrl: string|undefined): boolean {
  const args = ['publish', '--access', 'public', '--tag', distTag];
  // If a custom registry URL has been specified, add the `--registry` flag.
  if (registryUrl !== undefined) {
    args.push('--registry', registryUrl);
  }
  return spawnSync('npm', args, {cwd: packagePath, shell: true, stdio: 'inherit'}).status === 0;
}

/**
 * Sets the NPM tag to the specified version for the given package. The captured
 * output of the NPM command is printed to the current console.
 * @returns A boolean indicating success or failures.
 */
export function setNpmTagForPackage(
    packageName: string, distTag: string, version: semver.SemVer, registryUrl: string|undefined) {
  const args = ['dist-tag', 'add', `${packageName}@${version}`, distTag];
  if (registryUrl !== undefined) {
    args.push('--registry', registryUrl);
  }
  return spawnSync('npm', args, {shell: true, stdio: 'inherit'}).status === 0;
}
