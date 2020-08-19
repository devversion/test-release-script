import {CutNewPatchAction} from './cut-new-patch';
import {CutNextPrereleaseAction} from './cut-next-prerelease';
import {CutReleaseCandidateAction} from './cut-release-candidate';
import {CutStableAction} from './cut-stable';
import {MoveNextIntoFeatureFreezeAction} from './move-next-into-feature-freeze';
import {CutPrereleaseForReleaseCandidateAction} from './cut-release-candidate-prerelease';

/**
 * List of release actions supported by the release staging tool. These are sorted
 * by priority. Actions which are selectable are sorted based on this declaration order.
 */
export const actions = [
  CutStableAction,
  CutReleaseCandidateAction,
  CutPrereleaseForReleaseCandidateAction,
  CutNewPatchAction,
  CutNextPrereleaseAction,
  MoveNextIntoFeatureFreezeAction,
];
