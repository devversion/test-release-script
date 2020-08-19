/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ReleaseAction} from '../actions';

export class CutNewPatchAction extends ReleaseAction {
  getDescription() {
    return `Cut a new patch release for the "${this._active.latest.branchName}" branch.`;
  }

  isValid(): boolean {
    // Patch versions can be cut at any time. See:
    // https://hackmd.io/2Le8leq0S6G_R5VEVTNK9A#Release-prompt-options.
    return true;
  }

  async perform() {}
}
