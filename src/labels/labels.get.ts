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
import { JenkinsLabel } from '../types';

/**
 * Get node label information
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} label - label name
 *
 * @example
 *
 * const label = await jenkins.labels.get('my-label');
 *
 * @example Example result:
 *
 * {
 *   _class: 'hudson.model.labels.LabelAtom',
 *   actions: [{}],
 *   busyExecutors: 1,
 *   clouds: [
 *     {
 *       _class: 'org.csanchez.jenkins.plugins.kubernetes.NonConfigurableKubernetesCloud',
 *       actions: [{}],
 *     },
 *   ],
 *   description: null,
 *   idleExecutors: 0,
 *   loadStatistics: {
 *     _class: 'hudson.model.Label$1',
 *     availableExecutors: {},
 *     busyExecutors: {},
 *     connectingExecutors: {},
 *     definedExecutors: {},
 *     idleExecutors: {},
 *     onlineExecutors: {},
 *     queueLength: {},
 *     totalExecutors: {},
 *   },
 *   name: 'cypress-tests-1-productivity-develop-19',
 *   nodes: [
 *     {
 *       _class: 'org.csanchez.jenkins.plugins.kubernetes.KubernetesSlave',
 *       assignedLabels: [
 *         {
 *           name: 'cypress-tests-1-productivity-develop-19',
 *         },
 *         {
 *           name: 'cypress-tests-1-productivity-develop-19-mc4pv-s5803',
 *         },
 *       ],
 *       mode: 'EXCLUSIVE',
 *       nodeDescription: 'cypress-tests-1-productivity-develop-19-mc4pv',
 *       nodeName: 'cypress-tests-1-productivity-develop-19-mc4pv-s5803',
 *       numExecutors: 1,
 *     },
 *   ],
 *   offline: false,
 *   tiedJobs: [],
 *   totalExecutors: 1,
 *   propertiesList: [],
 * }
 *
 */
export const get = async (requests: JenkinsRequests, label: string): Promise<JenkinsLabel> =>
  requests.get(`label/${label}/api/json`).then(res => res.data);
