import {join} from 'path';
import {exec} from 'shelljs';
import {ReleaseConfig} from '../dev-infra/release/config';

/** Configuration for the `ng-dev release` command. */
export const release: ReleaseConfig = {
  npmPackages: [
    '@angular/animations',
    '@angular/bazel',
  ],
  // TODO: Implement release package building here.
  buildPackages: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {name: "@test/animations", outputPath: join(__dirname, '../dist/animations')},
          {name: "@test/bazel", outputPath: join(__dirname, '../dist/bazel')},
        ]);
      }, 5000);
    });
  },
  // TODO: This can be removed once there is a org-wide tool for changelog generation.
  generateReleaseNotesForHead: async () => {
    exec('yarn -s gulp changelog', {cwd: join(__dirname, '../')});
  },
};
