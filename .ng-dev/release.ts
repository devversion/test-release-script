import {ReleaseConfig} from '../dev-infra/release/config';

/** Configuration for the `ng-dev release` command. */
export const release: ReleaseConfig = {
  releaseCommitMessage: version => `release: cut the v${version} release`,
  // TODO: Implement release package building here.
  buildPackages: () => [],
};
