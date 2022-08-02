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
 * Update node configuration
 *
 * @param {string} name - node name to update
 * @param {object} options - configuration for node. See [Creating node with the REST API](https://support.cloudbees.com/hc/en-us/articles/115003896171-Creating-node-with-the-REST-API)
 *
 * @example
 *
 * await jenkins.nodes.update('my-node', {
 *   numExecutors: '3',
 *   remoteFS: '/home/jenkins',
 *   nodeDescription: 'Agent node description',
 * });
 *
 */
export const update = async (
  requests: JenkinsRequests,
  name: string,
  options?: any,
): Promise<void> => {
  await requests.postForm(`/computer/${name}/configSubmit`, {
    name,
    type: options?.type || DEFAULT_NODE_TYPE,
    json: JSON.stringify(deepmerge({ ...DEFAULT_NODE_CONFIG, name }, options || {})),
  });
};
