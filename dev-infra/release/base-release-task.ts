import {GitClient} from '../utils/git/index';
import {ReleaseConfig} from './config';
import {getRepoBaseDir, GithubConfig} from '../utils/config';
import {error, red} from '../utils/console';
import {
  fetchActiveReleaseTrainBranches,
  getVersionOfBranch,
  GithubRepo,
  nextBranchName,
  ReleaseTrain
} from '../pr/merge/defaults/branches';

export interface ActiveReleaseTrains {
  /** Latest non-prerelease release-train (i.e. for the patch branch). */
  latest: ReleaseTrain;
  /** Release-train in the `next` phase (i.e. for the master branch). */
  next: ReleaseTrain;
  /** Release-train currently in the release-candidate/feature-freeze phase. */
  releaseCandidate: ReleaseTrain | null;
}

export class BaseReleaseTask {
  /** Client for interacting with the Github API and the local Git command. */
  git = new GitClient(this._githubToken, {github: this._github}, this._projectRoot);

  /** Describing the Github repository which should be released. */
  repo: GithubRepo = {owner: this._github.owner, repo: this._github.name, api: this.git.github};

  constructor(protected _config: ReleaseConfig,
              protected _github: GithubConfig,
              protected _githubToken: string,
              protected _projectRoot: string = getRepoBaseDir()) {}

  protected async _getActiveReleaseTrains(): Promise<ActiveReleaseTrains> {
    const nextVersion = await getVersionOfBranch(this.repo, nextBranchName);
    const nextReleaseTrain: ReleaseTrain = {version: nextVersion, branchName: nextBranchName};
    const {latest, releaseCandidate} = await fetchActiveReleaseTrainBranches(
        this.repo, nextVersion);
    return {latest, releaseCandidate, next: nextReleaseTrain}
  }

  /** Verifies that there are no uncommitted changes in the project. */
  protected _verifyNoUncommittedChanges() {
    if (this.git.hasUncommittedChanges()) {
      error(red(`  ✘   There are changes which are not committed and should be ` +
        `discarded.`));
      process.exit(1);
    }
  }
}
