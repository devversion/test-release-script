/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {green, info, log, yellow} from '../../utils/console';
import {ActiveReleaseTrains, BaseReleaseTask} from '../base-release-task';
import {ListChoiceOptions, prompt} from 'inquirer';
import {ReleaseAction} from './actions';
import {actions} from './actions/index';
import {GitCommandError} from '../../utils/git/index';

export class StageReleaseTask extends BaseReleaseTask {
  async run() {
    log();
    log(yellow('--------------------------------------------'));
    log(yellow('  Angular Dev-Infra release staging script'));
    log(yellow('--------------------------------------------'));
    log();

//    this._verifyNoUncommittedChanges();

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
      throw e;
    } finally {
      this.git.checkout(previousGitBranchOrRevision, true);
    }

    info(green('Successfully prepared the release!'));
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
