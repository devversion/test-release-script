/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {blue, bold, info} from '../../utils/console';
import {ReleaseConfig} from '../config/index';

import {isVersionPublishedToNpm} from './npm-registry';
import {ActiveReleaseTrains} from './release-trains';

/**
 * Prints the active release trains to the console.
 * @params active Active release trains that should be printed.
 * @params config Release configuration used for querying NPM on published versions.
 */
export async function printActiveReleaseTrains(
    active: ActiveReleaseTrains, config: ReleaseConfig): Promise<void> {
  const {releaseCandidate, next, latest} = active;
  const isNextMajor = next.version.minor === 0 && next.version.patch === 0;
  const isNextPublishedToNpm = await isVersionPublishedToNpm(next.version, config);
  const nextTrainType = isNextMajor ? 'major' : 'minor';

  info();
  info(blue('Currently active release branches in the project:'));
  // If there is a release-train currently in feature-freeze/release-candidate
  // phase, print it's corresponding Git branch and the target release type.
  if (releaseCandidate !== null) {
    const rcVersion = releaseCandidate.version;
    const isRcForMajor = rcVersion.minor === 0 && rcVersion.patch === 0;
    const rcTrainType = isRcForMajor ? 'major' : 'minor';
    const rcTrainPhase =
        rcVersion.prerelease[0] === 'next' ? 'feature-freeze' : 'release-candidate';
    info(
        ` • ${bold(releaseCandidate.branchName)} contains changes for an upcoming ` +
        `${rcTrainType}, currently in ${rcTrainPhase} phase.`);
    info(`   Most recent pre-release for this branch is "${bold(`v${rcVersion}`)}".`);
  }

  // Print information about the release-train in the latest phase. i.e. the patch branch.
  info(` • ${bold(latest.branchName)} contains changes for the most recent patch.`);
  info(`   Most recent patch version for this branch is "${bold(`v${latest.version}`)}".`);

  // Print information about the release-train in the next phase.
  info(
      ` • ${bold(next.branchName)} contains changes for a ${nextTrainType} ` +
      `currently in active development.`);
  // Note that there is a special case for versions in the next release-train. The version in
  // the next branch is not always published to NPM. This can happen when we recently branched
  // off for a feature-freeze release-train. More details are in the next pre-release action.
  if (isNextPublishedToNpm) {
    info(`   Most recent pre-release version for this branch is "${bold(`v${next.version}`)}".`);
  } else {
    info(
        `   Version is currently set to "${bold(`v${next.version}`)}", but has not been ` +
        ` published.`);
  }
  info();
}
