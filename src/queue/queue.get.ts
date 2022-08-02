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
import { JenkinsQueueItem } from '../types';

/**
 * Get queue item by id
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {number} id - queue id
 *
 * @example
 *
 * const queueItem = await jenkins.queue.get(1790);
 *
 * @example Example result:
 *
 * {
 *   _class: 'hudson.model.Queue$WaitingItem',
 *   actions: [
 *     {
 *       _class: 'hudson.model.CauseAction',
 *       causes: [
 *         {
 *           _class: 'hudson.model.Cause$UserIdCause',
 *           shortDescription: 'Started by user admin',
 *           userId: 'admin',
 *           userName: 'admin',
 *         },
 *       ],
 *     },
 *   ],
 *   blocked: false,
 *   buildable: false,
 *   id: 1790,
 *   inQueueSince: 1650047426432,
 *   params: '',
 *   stuck: false,
 *   task: {
 *     _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
 *     name: 'job1',
 *     url: 'http://localhost:8080/job/e010173e-ce32-441f-a9a7-e1d2ecd4fbc2/job/job1/',
 *     color: 'notbuilt',
 *   },
 *   url: 'queue/item/1790/',
 *   why: 'In the quiet period. Expires in 4.6 sec',
 *   timestamp: 1650047431432,
 * }
 */
export const get = async (requests: JenkinsRequests, id: number): Promise<JenkinsQueueItem> =>
  requests.get(`/queue/item/${id}/api/json`).then(r => r.data);
