/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';

import {spawnSilentWithDebugOutput} from '../../utils/child-process';
import {error, green, info, red} from '../../utils/console';
import {BuiltPackage} from '../config/index';

import {FatalReleaseActionError} from './actions-error';

/*
 * ###############################################################
 *
 * This file contains helpers for invoking external `ng-dev` commands. A subset of actions,
 * like building release output or setting a NPM dist tag for release packages, cannot be
 * performed directly as part of the release tool and need to be delegated to external `ng-dev`
 * commands that exist across arbitrary version branches.
 *
 * In an concrete example: Consider a new patch version is released and that a new release
 * package has been added to the `next` branch. The patch branch will not contain the new
 * release package, so we could not build the release output for it. To work around this, we
 * call the ng-dev build command for the patch version branch and expect it to return a list
 * of built packages that need to be released as part of this release train.
 *
 * ###############################################################
 */

/**
 * Invokes the `ng-dev release set-dist-tag` command in order to set the specified
 * NPM dist tag for all packages in the checked out branch to the given version.
 */
export async function invokeSetNpmDistCommand(npmDistTag: string, version: semver.SemVer) {
  // Note: No progress indicator needed as that is the responsibility of the command.
  const {success} = await spawnSilentWithDebugOutput(
      'yarn', ['ng-dev', 'release', 'set-dist-tag', npmDistTag, version.format()]);
  if (success) {
    info(green(`  ✓   Set "${npmDistTag}" NPM dist tag for all packages to v${version}.`));
  } else {
    error(red(`  ✘   An error occurred while setting the NPM dist tag for ${npmDistTag}.`));
    throw new FatalReleaseActionError();
  }
}

/**
 * Invokes the `ng-dev release build` command in order to build the release
 * packages for the currently checked out branch.
 */
export async function invokeReleaseBuildCommand(): Promise<BuiltPackage[]> {
  // Note: No progress indicator needed as that is the responsibility of the command.
  const {success, stdout} =
      await spawnSilentWithDebugOutput('yarn', ['ng-dev', 'release', 'build', '--json']);
  if (success) {
    info(green(`  ✓   Built release output for all packages.`));
    // The `ng-dev release build` command prints a JSON array to stdout
    // that represents the built release packages and their output paths.
    return JSON.parse(stdout);
  } else {
    error(red(`  ✘   An error occurred while building the release packages.`));
    throw new FatalReleaseActionError();
  }
}

/**
 * Invokes the `yarn install` command in order to install dependencies for
 * the configured project with the currently checked out revision.
 */
export async function invokeYarnInstallCommand(projectDir: string): Promise<void> {
  // Note: No progress indicator needed as that is the responsibility of the command.
  const success = await spawnSilentWithDebugOutput(
      'yarn', ['install', '--frozen-lockfile', '--non-interactive'],
      {cwd: projectDir, shell: true});

  if (success) {
    info(green(`  ✓   Installed project dependencies.`));
  } else {
    error(red(`  ✘   An error occurred while installing dependencies.`));
    throw new FatalReleaseActionError();
  }
}
