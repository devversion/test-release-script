/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {spawn, SpawnSyncOptions} from 'child_process';
import {debug} from './console';

/**
 * Spawns a given command with arguments silently. All process stdout and stderr output
 * is captured and printed through the `debug` level. This allows for debugging if needed.
 */
export function spawnSilentWithDebugOutput(
    command: string, args: string[],
    options: Omit<SpawnSyncOptions, 'stdio'>): Promise<boolean> {
  return new Promise(resolve => {
    const childProcess = spawn(command, args,
        {...options, stdio: ['inherit', 'pipe', 'pipe']});
    let logOutput = '';

    childProcess.stdout.on('data', message => logOutput += message);
    childProcess.stderr.on('data', message => logOutput += message);
    childProcess.on('exit', (status, signal) => {
      const exitDescription = status !== null ? `exit code "${status}"` : `signal "${signal}"`;
      debug(`Command: ${command} ${args.join(' ')} completed with ${exitDescription}.`);
      debug(`Log output: ${logOutput}`);

      resolve(status === 0)
    });
  });
}
