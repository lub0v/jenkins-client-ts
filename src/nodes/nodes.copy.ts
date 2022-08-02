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

/**
 * Copy node - create new node from existing one
 *
 * @param {string} name - node name to copy from
 * @param {string} newName - new node name
 *
 * @example
 *
 * await jenkins.nodes.copy('my-existing-node', 'my-new-node');
 *
 */
export const copy = async (
  requests: JenkinsRequests,
  name: string,
  newName: string,
): Promise<void> => {
  const data = { name: newName, mode: 'copy', from: name };
  await requests.postForm('/computer/createItem', {
    ...data,
    json: JSON.stringify(data),
  });
};
