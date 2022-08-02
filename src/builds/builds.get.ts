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
import { JenkinsBuild } from '../types';
import { JobPath } from '../utils/jobPath';

/**
 * Get build information
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} path - path to the job
 * @param {number} buildNumber - job build number
 *
 * @example
 *
 * const build = await jenkins.builds.get('my-job', 1);
 *
 * @example Example result:
 *
 * {
 *   _class: 'org.jenkinsci.plugins.workflow.job.WorkflowRun',
 *   actions: [
 *     {
 *       _class: 'hudson.model.ParametersAction',
 *       parameters: [
 *         {
 *           _class: 'hudson.model.StringParameterValue',
 *           name: 'param',
 *           value: 'MyParam',
 *         },
 *       ],
 *     },
 *     {
 *       _class: 'hudson.model.CauseAction',
 *       causes: [
 *         {
 *           _class: 'hudson.model.Cause$RemoteCause',
 *           shortDescription: 'Started by remote host 172.26.0.1',
 *           addr: '172.26.0.1',
 *           note: null,
 *         },
 *       ],
 *     },
 *     {
 *       _class: 'org.jenkinsci.plugins.workflow.libs.LibrariesAction',
 *     },
 *     {},
 *     {},
 *     {
 *       _class: 'org.jenkinsci.plugins.displayurlapi.actions.RunDisplayAction',
 *     },
 *     {
 *       _class:
 *         'org.jenkinsci.plugins.pipeline.modeldefinition.actions.RestartDeclarativePipelineAction',
 *     },
 *     {},
 *     {
 *       _class: 'org.jenkinsci.plugins.workflow.job.views.FlowGraphAction',
 *     },
 *     {},
 *     {},
 *     {},
 *   ],
 *   artifacts: [],
 *   building: false,
 *   description: null,
 *   displayName: '#1',
 *   duration: 149,
 *   estimatedDuration: 149,
 *   executor: null,
 *   fullDisplayName: 'a7c06f5c-0234-4d31-b0cc-05b239c6ce21 » jobWParamsAndToken #1',
 *   id: '1',
 *   keepLog: false,
 *   number: 1,
 *   queueId: 1857,
 *   result: 'SUCCESS',
 *   timestamp: 1650317856368,
 *   url: 'http://localhost:8080/job/a7c06f5c-0234-4d31-b0cc-05b239c6ce21/job/jobWParamsAndToken/1/',
 *   changeSets: [],
 *   culprits: [],
 *   nextBuild: null,
 *   previousBuild: null,
 * }
 *
 */
export const get = async (
  requests: JenkinsRequests,
  path: string,
  buildNumber: number,
): Promise<JenkinsBuild> =>
  requests.get(`${JobPath.parse(path).path()}/${buildNumber}/api/json`).then(res => res.data);
