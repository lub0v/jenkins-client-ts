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
 * Add job to the view
 *
 * If view configuration has enabled Job Filter "Recurse in subfolders" then you can add any job located
 * in the subfolders but if this filter is disabled, you can only add jobs located directly in the current folder.
 *
 * @param requests
 * @param {string} path - path to the folder with view
 * @param {string} name - view name
 * @param {string} jobPath - path for the job to add. Path can be relative to the folder or absolute. If job is not located in the folder it won't be added.
 *
 * @example
 *
 * await jenkins.views.addJob('/my-folder', 'MyView', '/my-folder/my-job');
 *
 * @example
 *
 * await jenkins.views.addJob('/my-folder', 'MyView', 'my-job');
 *
 */
export const addJob = async (
  requests: JenkinsRequests,
  path: string,
  name: string,
  jobPath: string,
): Promise<void> => {
  await requests.postForm(`${viewUrl(path, name)}/addJobToView`, {
    name: getRelativePath(path, name, jobPath),
  });
};
