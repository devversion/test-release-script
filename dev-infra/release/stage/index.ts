/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {error, green, info, log, red, yellow} from '../../utils/console';
import {ActiveReleaseTrains, BaseReleaseTask} from '../base-release-task';
import {ListChoiceOptions, prompt} from 'inquirer';
import {ReleaseAction} from './actions';
import {actions} from './actions/index';
import {FatalReleaseActionError, UserAbortedReleaseActionError} from './actions-error';

export enum StageReleaseStatus {
  SUCCESS,
  FATAL_ERROR,
  MANUALLY_ABORTED,
}

export class StageReleaseTask extends BaseReleaseTask {

  /** Runs the release staging script. */
  async run(): Promise<StageReleaseStatus> {
    log();
    log(yellow('--------------------------------------------'));
    log(yellow('  Angular Dev-Infra release staging script'));
    log(yellow('--------------------------------------------'));
    log();

    this._verifyNoUncommittedChanges();

    const releaseTrains = /* TODO await this._getActiveReleaseTrains(); */ {
      next: {branchName: 'master', version: require('semver').parse('10.2.0-next.0')},
      latest: {branchName: '10.0.x', version: require('semver').parse('10.0.2')},
      releaseCandidate: {branchName: '10.1.x', version: require('semver').parse('10.1.0-next.0')}
    };
    const action = await this._promptForReleaseAction(releaseTrains);
    const previousGitBranchOrRevision = this.git.getCurrentBranchOrRevision();

    try {
      await action.perform();
    } catch (e) {
      if (e instanceof UserAbortedReleaseActionError) {
        return StageReleaseStatus.MANUALLY_ABORTED;
      }
      // Only print the error message and stack if the error is not a known fatal release
      // action error (for which we print the error gracefully to the console with colors).
      if (!(e instanceof FatalReleaseActionError) && e instanceof Error) {
        console.error(e.message);
        console.error(e.stack);
      }
      return StageReleaseStatus.FATAL_ERROR;
    } finally {
      this.git.checkout(previousGitBranchOrRevision, true);
    }

    return StageReleaseStatus.SUCCESS;
  }

  private async _promptForReleaseAction(active: ActiveReleaseTrains) {
    const validActions = actions
      .map(action => new action(active, this.git, this._config, this._projectRoot))
      .filter(action => action.isValid());
    const choices: ListChoiceOptions[] = validActions
      .map(action => ({name: action.getDescription(), value: action}));

    info(`Please select the type of release you want to perform.`);

    const {releaseAction} = await prompt<{releaseAction: ReleaseAction}>({
      name: 'releaseAction',
      message: 'Please select an action:',
      type: 'list',
      choices,
    });

    return releaseAction;
  }
}
