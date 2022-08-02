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

import deepmerge from 'deepmerge';
import { JenkinsRequests } from '../requests';
import { DEFAULT_NODE_CONFIG, DEFAULT_NODE_TYPE } from './nodes.defaultConfig';

/**
 * Create node
 *
 * @param requests
 * @param {string} name - new node name
 * @param {object} [options] - options for node creation. See [Creating node with the REST API](https://support.cloudbees.com/hc/en-us/articles/115003896171-Creating-node-with-the-REST-API)
 *
 * @example
 *
 * await jenkins.nodes.create('default-node');
 *
 * @example
 *
 * await jenkins.nodes.create('my-node', {
 *   launcher: {
 *     '': '2',
 *     $class: 'hudson.plugins.sshslaves.SSHLauncher',
 *     credentialsId: 'd436fff1-af1c-45df-8cb6-3907d119b8fa',
 *     host: 'host',
 *     javaPath: '',
 *     jvmOptions: '',
 *     launchTimeoutSeconds: '',
 *     maxNumRetries: '',
 *     port: '22',
 *     prefixStartSlaveCmd: '',
 *     suffixStartSlaveCmd: '',
 *     retryWaitTime: '',
 *     sshHostKeyVerificationStrategy: {
 *       $class: 'hudson.plugins.sshslaves.verifiers.ManuallyTrustedKeyVerificationStrategy',
 *       requireInitialManualTrust: true,
 *       'stapler-class': 'hudson.plugins.sshslaves.verifiers.ManuallyTrustedKeyVerificationStrategy',
 *     },
 *     'stapler-class': 'hudson.plugins.sshslaves.SSHLauncher',
 *   },
 *   retentionStrategy: {
 *     $class: 'hudson.slaves.RetentionStrategy$Always',
 *     'stapler-class': 'hudson.slaves.RetentionStrategy$Always',
 *   },
 *   type: 'hudson.slaves.DumbSlave',
 *   mode: 'NORMAL',
 *   numExecutors: '1',
 *   remoteFS: '/home/jenkins',
 *   nodeDescription: 'Agent node description',
 *   labelString: 'agent-node-label',
 *   nodeProperties: {
 *     'stapler-class-bag': 'true',
 *   },
 * });
 *
 */
export const create = async (
  requests: JenkinsRequests,
  name: string,
  options?: any,
): Promise<void> => {
  await requests.postForm('/computer/doCreateItem', {
    name,
    type: options?.type || DEFAULT_NODE_TYPE,
    json: JSON.stringify(deepmerge(DEFAULT_NODE_CONFIG, options || {})),
  });
};
