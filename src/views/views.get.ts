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
import { JenkinsView } from '../types';
import { viewUrl } from './views.url';

/**
 * Get view info
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} path - path to the folder
 * @param {string} name - view name
 *
 * @example
 *
 * const rootView  = await jenkins.views.get('/', 'All');
 *
 * @example Example result:
 *
 * {
 *   _class: 'hudson.model.AllView',
 *   description: null,
 *   jobs: [
 *     {
 *       _class: 'com.cloudbees.hudson.plugins.folder.Folder',
 *       name: 'my-folder',
 *       url: 'http://localhost:8080/job/my-folder/',
 *     },
 *   ],
 *   name: 'all',
 *   property: [],
 *   url: 'http://localhost:8080/',
 * }
 *
 */
export const get = async (
  requests: JenkinsRequests,
  path: string,
  name: string,
): Promise<JenkinsView> => requests.get(`${viewUrl(path, name)}/api/json`).then(res => res.data);
