/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as semver from 'semver';
import {assertNoErrors, getConfig, NgDevConfig} from '../utils/config';

/** Configuration for staging and publishing a release. */
export interface ReleaseConfig {
  /** Builds release packages and returns a list of paths pointing to built packages. */
  buildPackages: () => Promise<string[]>|string[];
  /** Function that returns the commit message for a release bump. */
  releaseCommitMessage: (versionName: semver.SemVer) => string;
}

/** Configuration for releases in the dev-infra configuration. */
export type DevInfraReleaseConfig = NgDevConfig<{release: ReleaseConfig}>

/** Retrieve and validate the config as `ReleaseConfig`. */
export function getReleaseConfig(
    config: Partial<DevInfraReleaseConfig> = getConfig()): ReleaseConfig {
  // List of errors encountered validating the config.
  const errors: string[] = [];

  if (config.release === undefined) {
    errors.push(`No configuration defined for "release"`);
  } else if (config.release.buildPackages === undefined) {
    errors.push(`No "buildPackages" function configured for releasing.`);
  }

  assertNoErrors(errors);
  return config.release!;
}
