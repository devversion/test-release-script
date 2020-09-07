/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';
import {spawnSilentWithDebugOutput} from '../../utils/child-process';

/**
 * Runs NPM publish within a specified package directory. The captured output
 * of the NPM publish command is printed to the current console.
 * @returns A promise resolving to a boolean indicating success or failures.
 */
export async function runNpmPublish(
    packagePath: string, distTag: string, registryUrl: string|undefined): Promise<boolean> {
  const args = ['publish', '--access', 'public', '--tag', distTag];
  // If a custom registry URL has been specified, add the `--registry` flag.
  if (registryUrl !== undefined) {
    args.push('--registry', registryUrl);
  }
  const {success} = await spawnSilentWithDebugOutput('npm', args, {cwd: packagePath, shell: true});
  return success;
}

/**
 * Sets the NPM tag to the specified version for the given package. The captured
 * output of the NPM command is printed to the current console.
 * @returns A promise resolving to a boolean indicating success or failures.
 */
export async function setNpmTagForPackage(
    packageName: string, distTag: string, version: semver.SemVer,
    registryUrl: string|undefined): Promise<boolean> {
  const args = ['dist-tag', 'add', `${packageName}@${version}`, distTag];
  if (registryUrl !== undefined) {
    args.push('--registry', registryUrl);
  }
  const {success} = await spawnSilentWithDebugOutput('npm', args, {shell: true});
  return success;
}
