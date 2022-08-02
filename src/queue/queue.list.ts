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
import { JenkinsQueue } from '../types';
import { JobPath } from '../utils/jobPath';

/**
 * List queue
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} [path] - optionally specify job path to filter queue items by job
 *
 * @example
 *
 * const queue = await jenkins.queue.list();
 *
 * @example
 *
 * const queue = await jenkins.queue.list('/folder/my-job');
 *
 * @example Example result:
 *
 * {
 *   _class: 'hudson.model.Queue',
 *   discoverableItems: [],
 *   items: [
 *     {
 *       _class: 'hudson.model.Queue$WaitingItem',
 *       actions: [
 *         {
 *           _class: 'hudson.model.CauseAction',
 *           causes: [
 *             {
 *               _class: 'hudson.model.Cause$UserIdCause',
 *               shortDescription: 'Started by user admin',
 *               userId: 'admin',
 *               userName: 'admin',
 *             },
 *           ],
 *         },
 *       ],
 *       blocked: false,
 *       buildable: false,
 *       id: 1798,
 *       inQueueSince: 1650047730909,
 *       params: '',
 *       stuck: false,
 *       task: {
 *         _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
 *         name: 'job1',
 *         url: 'http://localhost:8080/job/e0c9a9bd-5577-4670-bc6f-ee40abcd2adc/job/job1/',
 *         color: 'notbuilt',
 *       },
 *       url: 'queue/item/1798/',
 *       why: 'In the quiet period. Expires in 4.8 sec',
 *       timestamp: 1650047735909,
 *     },
 *     {
 *       _class: 'hudson.model.Queue$WaitingItem',
 *       actions: [
 *         {
 *           _class: 'hudson.model.CauseAction',
 *           causes: [
 *             {
 *               _class: 'hudson.model.Cause$UserIdCause',
 *               shortDescription: 'Started by user admin',
 *               userId: 'admin',
 *               userName: 'admin',
 *             },
 *           ],
 *         },
 *       ],
 *       blocked: false,
 *       buildable: false,
 *       id: 1799,
 *       inQueueSince: 1650047730984,
 *       params: '',
 *       stuck: false,
 *       task: {
 *         _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
 *         name: 'job2',
 *         url: 'http://localhost:8080/job/e0c9a9bd-5577-4670-bc6f-ee40abcd2adc/job/job2/',
 *         color: 'notbuilt',
 *       },
 *       url: 'queue/item/1799/',
 *       why: 'In the quiet period. Expires in 4.9 sec',
 *       timestamp: 1650047735984,
 *     },
 *   ],
 * }
 */
export const list = async (requests: JenkinsRequests, path?: string): Promise<JenkinsQueue> => {
  const queue: JenkinsQueue = await requests.get('/queue/api/json').then(res => res.data);
  if (path) {
    const jobPath = JobPath.parse(path).path();
    queue.items = queue.items.filter(item => item.task.url.includes(jobPath));
  }
  return queue;
};
