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
import { JenkinsNode } from '../types';

/**
 * Get node information
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} name - node name. For the built-in node use parentheses: `(built-in)`
 *
 * @example
 *
 * const node = await jenkins.nodes.get('(built-in)');
 *
 * @example Example result:
 *
 * {
 *  _class: 'hudson.model.Hudson$MasterComputer',
 *  actions: [],
 *  assignedLabels: [ { name: 'another' }, { name: 'built-in' } ],
 *  description: 'the Jenkins controller's built-in node',
 *  displayName: 'Built-In Node',
 *  executors: [ {}, {} ],
 *  icon: 'computer.png',
 *  iconClassName: 'icon-computer',
 *  idle: true,
 *  jnlpAgent: false,
 *  launchSupported: true,
 *  loadStatistics: { _class: 'hudson.model.Label$1' },
 *  manualLaunchAllowed: true,
 *  monitorData: {
 *   'hudson.node_monitors.SwapSpaceMonitor': {
 *    _class: 'hudson.node_monitors.SwapSpaceMonitor$MemoryUsage2',
 *    availablePhysicalMemory: 5502185472,
 *    availableSwapSpace: 2147479552,
 *    totalPhysicalMemory: 8345554944,
 *    totalSwapSpace: 2147479552
 *   },
 *   'hudson.node_monitors.TemporarySpaceMonitor': {
 *    _class: 'hudson.node_monitors.DiskSpaceMonitorDescriptor$DiskSpace',
 *    timestamp: 1649971520244,
 *    path: '/tmp',
 *    size: 5669916672
 *   },
 *   'hudson.node_monitors.DiskSpaceMonitor': {
 *    _class: 'hudson.node_monitors.DiskSpaceMonitorDescriptor$DiskSpace',
 *    timestamp: 1649971520244,
 *    path: '/var/jenkins_home',
 *    size: 179432824832
 *   },
 *   'hudson.node_monitors.ArchitectureMonitor': 'Linux (amd64)',
 *   'hudson.node_monitors.ResponseTimeMonitor': {
 *    _class: 'hudson.node_monitors.ResponseTimeMonitor$Data',
 *    timestamp: 1649971520244,
 *    average: 0
 *   },
 *   'hudson.node_monitors.ClockMonitor': { _class: 'hudson.util.ClockDifference', diff: 0 }
 *  },
 *  numExecutors: 2,
 *  offline: false,
 *  offlineCause: null,
 *  offlineCauseReason: '',
 *  oneOffExecutors: [],
 *  temporarilyOffline: false
 * }
 *
 * @example
 *
 * const node = await jenkins.nodes.get('MyNode');
 *
 * @example Example result:
 *
 * {
 *  _class: 'hudson.slaves.SlaveComputer',
 *  actions: [],
 *  assignedLabels: [ { name: 'MyNode' } ],
 *  description: null,
 *  displayName: 'MyNode',
 *  executors: [ {} ],
 *  icon: 'computer-x.png',
 *  iconClassName: 'icon-computer-x',
 *  idle: true,
 *  jnlpAgent: true,
 *  launchSupported: false,
 *  loadStatistics: { _class: 'hudson.model.Label$1' },
 *  manualLaunchAllowed: true,
 *  monitorData: {
 *   'hudson.node_monitors.SwapSpaceMonitor': null,
 *   'hudson.node_monitors.TemporarySpaceMonitor': null,
 *   'hudson.node_monitors.DiskSpaceMonitor': null,
 *   'hudson.node_monitors.ArchitectureMonitor': null,
 *   'hudson.node_monitors.ResponseTimeMonitor': null,
 *   'hudson.node_monitors.ClockMonitor': null
 *  },
 *  numExecutors: 1,
 *  offline: true,
 *  offlineCause: null,
 *  offlineCauseReason: '',
 *  oneOffExecutors: [],
 *  temporarilyOffline: false,
 *  absoluteRemotePath: null
 * }
 */
export const get = async (requests: JenkinsRequests, name: string): Promise<JenkinsNode> =>
  requests.get(`/computer/${name}/api/json`).then(res => res.data);
