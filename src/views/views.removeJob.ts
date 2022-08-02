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
import { viewUrl } from './views.url';
import { getRelativePath } from './views.getRelativePath';

/**
 * Remove job from view
 *
 * @param requests
 * @param {string} path - path to the folder with view
 * @param {string} name - view name to delete
 * @param {string} jobPath - path for the job to remove. Path can be relative to the folder or absolute.
 *
 * @example
 *
 * await jenkins.views.removeJob('/my-folder', 'MyView', 'my-job');
 *
 * @example
 *
 * await jenkins.views.removeJob('/my-folder', 'MyView', '/my-folder/my-job');
 *
 */
export const removeJob = async (
  requests: JenkinsRequests,
  path: string,
  name: string,
  jobPath: string,
): Promise<void> => {
  await requests.postForm(`${viewUrl(path, name)}/removeJobFromView`, {
    name: getRelativePath(path, name, jobPath),
  });
};
