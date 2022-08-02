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
import { JenkinsJob } from '../types';
import { JobPath } from '../utils/jobPath';

/**
 * Get job information
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} path - path to the job
 *
 * @example
 *
 * const job = await jenkins.jobs.get('/job/folder/job/my-job');
 *
 * @example
 *
 * const job = await jenkins.jobs.get('/folder/my-job');
 *
 * @example Example result:
 *
 * {
 *   _class: 'hudson.model.FreeStyleProject',
 *   actions: [
 *     {},
 *     {},
 *     {
 *       _class: 'org.jenkinsci.plugins.displayurlapi.actions.JobDisplayAction',
 *     },
 *     {
 *       _class: 'com.cloudbees.plugins.credentials.ViewCredentialsAction',
 *     },
 *   ],
 *   description: '',
 *   displayName: 'freestyle2',
 *   displayNameOrNull: null,
 *   fullDisplayName: 'freestyle2',
 *   fullName: 'freestyle2',
 *   name: 'freestyle2',
 *   url: 'http: * localhost:8080/job/freestyle2/',
 *   buildable: true,
 *   builds: [
 *     {
 *       _class: 'hudson.model.FreeStyleBuild',
 *       number: 2,
 *       url: 'http: * localhost:8080/job/freestyle2/2/',
 *     },
 *     {
 *       _class: 'hudson.model.FreeStyleBuild',
 *       number: 1,
 *       url: 'http: * localhost:8080/job/freestyle2/1/',
 *     },
 *   ],
 *   color: 'blue',
 *   firstBuild: {
 *     _class: 'hudson.model.FreeStyleBuild',
 *     number: 1,
 *     url: 'http: * localhost:8080/job/freestyle2/1/',
 *   },
 *   healthReport: [
 *     {
 *       description: 'Build stability: No recent builds failed.',
 *       iconClassName: 'icon-health-80plus',
 *       iconUrl: 'health-80plus.png',
 *       score: 100,
 *     },
 *   ],
 *   inQueue: false,
 *   keepDependencies: false,
 *   lastBuild: {
 *     _class: 'hudson.model.FreeStyleBuild',
 *     number: 2,
 *     url: 'http: * localhost:8080/job/freestyle2/2/',
 *   },
 *   lastCompletedBuild: {
 *     _class: 'hudson.model.FreeStyleBuild',
 *     number: 2,
 *     url: 'http: * localhost:8080/job/freestyle2/2/',
 *   },
 *   lastFailedBuild: null,
 *   lastStableBuild: {
 *     _class: 'hudson.model.FreeStyleBuild',
 *     number: 2,
 *     url: 'http: * localhost:8080/job/freestyle2/2/',
 *   },
 *   lastSuccessfulBuild: {
 *     _class: 'hudson.model.FreeStyleBuild',
 *     number: 2,
 *     url: 'http: * localhost:8080/job/freestyle2/2/',
 *   },
 *   lastUnstableBuild: null,
 *   lastUnsuccessfulBuild: null,
 *   nextBuildNumber: 3,
 *   property: [],
 *   queueItem: null,
 *   concurrentBuild: false,
 *   disabled: false,
 *   downstreamProjects: [],
 *   labelExpression: null,
 *   scm: {
 *     _class: 'hudson.scm.NullSCM',
 *   },
 *   upstreamProjects: [
 *     {
 *       _class: 'hudson.model.FreeStyleProject',
 *       name: 'freestyle1',
 *       url: 'http: * localhost:8080/job/freestyle1/',
 *       color: 'blue',
 *     },
 *   ],
 * }
 *
 */
export const get = (requests: JenkinsRequests, path: string): Promise<JenkinsJob> =>
  requests.get(`${JobPath.parse(path).path()}/api/json`).then(res => res.data);
