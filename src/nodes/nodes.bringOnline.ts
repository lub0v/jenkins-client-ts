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
 * Enable node - bring node back to online state
 *
 * @param {string} node - node name
 *
 * @example
 *
 * await jenkins.nodes.bringOnline('my-node');
 *
 */
export const bringOnline = async (requests: JenkinsRequests, node: string): Promise<void> => {
  const nodeRes = await get(requests, node);
  if (nodeRes.temporarilyOffline) {
    const data = { offlineMessage: '' };
    await requests.postForm(`/computer/${node}/toggleOffline`, {
      ...data,
      json: JSON.stringify(data),
    });
  }
};
