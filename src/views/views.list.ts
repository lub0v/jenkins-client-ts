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
import { JobPath } from '../utils/jobPath';

/**
 * List views
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} path - path to the folder
 *
 * @example
 *
 * const views = await jenkins.views.list('/');
 *
 * @example Example result:
 *
 * [
 *   {
 *     _class: 'hudson.model.AllView',
 *     name: 'all',
 *     url: 'http://localhost:8080/',
 *   }
 * ]
 *
 */
export const list = async (requests: JenkinsRequests, path: string): Promise<JenkinsView[]> =>
  requests.get(`${JobPath.parse(path).path()}/api/json`).then(res => {
    const { data } = res;
    if (!data.views) {
      throw new Error(`Cannot get views for path ${path}.`);
    }
    return data.views;
  });
