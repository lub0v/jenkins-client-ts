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
import { get } from './nodes.get';

/**
 * Disable node - mark node as offline. Use this method to update offline reason as well.
 *
 * @param {string} node - node name
 * @param {string} [reason] - reason for disabling this node
 *
 * @example
 *
 * await jenkins.nodes.markOffline('my-node', 'Disconnected because of network errors');
 *
 */
export const markOffline = async (
  requests: JenkinsRequests,
  node: string,
  reason: string = '',
): Promise<void> => {
  const nodeRes = await get(requests, node);
  const data = { offlineMessage: reason };
  await requests.postForm(
    `/computer/${node}/${nodeRes.temporarilyOffline ? 'changeOfflineCause' : 'toggleOffline'}`,
    {
      ...data,
      json: JSON.stringify(data),
    },
  );
};
