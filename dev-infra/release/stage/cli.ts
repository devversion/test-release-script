/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Arguments, Argv, CommandModule} from 'yargs';
import {error, green, info, red, yellow} from '../../utils/console';
import {GITHUB_TOKEN_GENERATE_URL} from '../../pr/checkout/cli';
import {StageReleaseStatus, StageReleaseTask} from './index';
import {getReleaseConfig} from '../config';
import {getConfig} from '../../utils/config';

interface ReleaseStageOptions {
  'github-token': string|undefined;
}

function builder(argv: Argv): Argv<ReleaseStageOptions> {
  return argv.option('github-token', {
    type: 'string',
    description: 'Github token. If not set, token is retrieved from the environment variables.'
  });
}

/** Yargs command handler for staging a release. */
async function handler(args: Arguments<ReleaseStageOptions>) {
  const githubToken = args['github-token'] || process.env.GITHUB_TOKEN || process.env.TOKEN;
  if (!githubToken) {
    error('No Github token set. Please set the `GITHUB_TOKEN` environment variable.');
    error('Alternatively, pass the `--github-token` command line flag.');
    error(`You can generate a token here: ${GITHUB_TOKEN_GENERATE_URL}`);
    process.exitCode = 1;
    return;
  }

  const config = getConfig();
  const task = new StageReleaseTask(getReleaseConfig(config), config.github, githubToken);
  const result = await task.run();

  switch (result) {
    case StageReleaseStatus.FATAL_ERROR:
      error(red(`Release action has been aborted due to fatal errors. See above.`));
      process.exitCode = 1;
      break;
    case StageReleaseStatus.MANUALLY_ABORTED:
      info(yellow(`Release action has been manually aborted.`));
      break;
    case StageReleaseStatus.SUCCESS:
      info(green(`Release action has completed successfully.`));
      break;
  }
}

/** CLI command module for staging a release. */
export const ReleaseStageCommandModule: CommandModule<{}, ReleaseStageOptions> = {
  builder,
  handler,
  command: 'stage',
  describe: 'Checkout a PR from the upstream repo',
};
