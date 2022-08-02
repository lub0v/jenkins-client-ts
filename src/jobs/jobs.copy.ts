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
import { JobPath } from '../utils/jobPath';
import { configXml } from './jobs.configXml';
import { create } from './jobs.create';

/**
 * Copy job from one path to another
 *
 * @param requests
 * @param {string} fromPath - path to the source job
 * @param {string} toPath - path to the new job
 *
 * @example
 *
 * await jenkins.jobs.copy('/folder1/my-job', '/other-folder/job-copy');
 *
 */
export const copy = async (
  requests: JenkinsRequests,
  fromPath: string,
  toPath: string,
): Promise<void> => {
  const to = JobPath.parse(toPath);
  const config = await configXml(requests, fromPath);
  await create(requests, to.parent().path(), to.name(), config);
};
