/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {spawn, SpawnSyncOptions} from 'child_process';
import {debug, error} from './console';

/** Interface describing the result of a spawned process. */
export interface SpawnedProcessResult {
  /** Whether the process completed successfully. */
  success: boolean;
  /** Captured stdout in string format. */
  stdout: string;
}

/**
 * Spawns a given command with arguments silently. All process stdout and stderr output is
 * captured and printed on error. On success, the output is printed through the `debug`
 * console level.
 */
export function spawnSilentWithDebugOutput(
    command: string, args: string[],
    options: Omit<SpawnSyncOptions, 'stdio'> = {}): Promise<SpawnedProcessResult> {
  return new Promise(resolve => {
    const childProcess = spawn(command, args, {...options, stdio: ['inherit', 'pipe', 'pipe']});
    let logOutput = '';
    let stdout = '';

    // Capture the stdout separately so that it can be passed as resolve value.
    // This is useful if commands return parsable stdout.
    childProcess.stderr.on('data', message => logOutput += message);
    childProcess.stdout.on('data', message => {
      stdout += message;
      logOutput += message;
    });

    childProcess.on('exit', (status, signal) => {
      const exitDescription = status !== null ? `exit code "${status}"` : `signal "${signal}"`;
      const printFn = status === 0 ? debug : error;

      printFn(`Command "${command} ${args.join(' ')}" completed with ${exitDescription}.`);
      printFn(`Process output: ${logOutput}`);
      resolve({success: status === 0, stdout});
    });
  });
}
