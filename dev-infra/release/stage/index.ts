/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {info, log, yellow} from '../../utils/console';
import {ActiveReleaseTrains, BaseReleaseTask} from '../base-release-task';
import {ListChoiceOptions, prompt} from 'inquirer';
import {ReleaseAction} from './actions';
import {actions} from './actions/index';

export class StageReleaseTask extends BaseReleaseTask {
  async run() {
    log();
    log(yellow('--------------------------------------------'));
    log(yellow('  Angular Dev-Infra release staging script'));
    log(yellow('--------------------------------------------'));
    log();

//    this._verifyNoUncommittedChanges();

    const releaseTrains = await this._getActiveReleaseTrains();
    const action = await this._promptForReleaseAction(releaseTrains);

    await action.perform();
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
