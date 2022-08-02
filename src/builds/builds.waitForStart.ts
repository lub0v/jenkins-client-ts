/* Copyright 2022 Parsable Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { JenkinsRequests } from '../requests';
import { JenkinsBuild, JenkinsBuildWaitOptions } from '../types';
import { get } from './builds.get';
import { waitWhile } from '../utils/waitWhile';

/**
 * Wait for build to start and return build information
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} path - path to the job
 * @param {number} buildNumber - job build number
 * @param {JenkinsBuildWaitOptions} options - build wait options
 *
 * - `interval` - how often to check job build status. Default `1000` milliseconds.
 * - `timeout` - timeout in milliseconds for job build to start building, will throw `Timeout 408` error if not completed in time. By default waits forever.
 *
 * @example
 *
 * const build = await jenkins.builds.waitForStart('/job/folder/job/my-job', 1);
 *
 * @example Example result:
 *
 *
 * {
 *   _class: 'org.jenkinsci.plugins.workflow.job.WorkflowRun',
 *   actions: [
 *     {
 *       _class: 'hudson.model.CauseAction',
 *       causes: [
 *         {
 *           _class: 'hudson.model.Cause$UserIdCause',
 *         },
 *       ],
 *     },
 *     {
 *       _class: 'org.jenkinsci.plugins.workflow.libs.LibrariesAction',
 *       libraries: [],
 *     },
 *     {
 *       _class: 'org.jenkinsci.plugins.displayurlapi.actions.RunDisplayAction',
 *       artifactsUrl: 'http://localhost:8080/job/folder/job/my-job/1/artifact',
 *       changesUrl: 'http://localhost:8080/job/folder/job/my-job/changes',
 *       displayUrl: 'http://localhost:8080/job/folder/job/my-job/1/',
 *       testsUrl: 'http://localhost:8080/job/folder/job/my-job/1/testReport',
 *     },
 *     {
 *       _class:
 *         'org.jenkinsci.plugins.pipeline.modeldefinition.actions.RestartDeclarativePipelineAction',
 *       restartEnabled: false,
 *       restartableStages: [],
 *     },
 *     {},
 *     {
 *       _class: 'org.jenkinsci.plugins.workflow.job.views.FlowGraphAction',
 *       nodes: [
 *         {
 *           _class: 'org.jenkinsci.plugins.workflow.graph.FlowStartNode',
 *         },
 *         {
 *           _class: 'org.jenkinsci.plugins.workflow.cps.nodes.StepAtomNode',
 *         },
 *         {
 *           _class: 'org.jenkinsci.plugins.workflow.graph.FlowEndNode',
 *         },
 *       ],
 *     }
 *   ],
 *   artifacts: [],
 *   building: true,
 *   description: null,
 *   displayName: '#1',
 *   duration: 0,
 *   estimatedDuration: -1,
 *   executor: {
 *     _class: 'hudson.model.OneOffExecutor',
 *     currentExecutable: { _class: 'org.jenkinsci.plugins.workflow.job.WorkflowRun' },
 *     idle: false,
 *     likelyStuck: false,
 *     number: -1,
 *     progress: -1
 *   },
 *   fingerprint: [],
 *   fullDisplayName: 'folder » my-job #1',
 *   id: '1',
 *   keepLog: false,
 *   number: 1,
 *   queueId: 1821,
 *   result: null,
 *   timestamp: 1650054944928,
 *   url: 'http://localhost:8080/job/folder/job/my-job/1/',
 *   changeSets: [],
 *   culprits: [],
 *   nextBuild: null,
 *   previousBuild: null,
 * }
 *
 */
export const waitForStart = async (
  requests: JenkinsRequests,
  path: string,
  buildNumber: number,
  options?: JenkinsBuildWaitOptions,
): Promise<JenkinsBuild> => {
  const req = requests.clone({ params: { depth: 1 } });
  return (await waitWhile<JenkinsBuild>(
    () => get(req, path, buildNumber),
    r => !r.ok || !r.data,
    options,
  ))!;
};
