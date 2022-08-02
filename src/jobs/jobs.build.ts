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
import { JenkinsQueueItem, JobBuildOptions } from '../types';
import { get as queueGet } from '../queue/queue.get';
import { JobPath } from '../utils/jobPath';
import { wait } from '../builds/builds.wait';
import { waitForStart } from '../builds/builds.waitForStart';
import { waitWhile } from '../utils/waitWhile';

export type JobBuildParameters = {
  [p: string]: string;
};

function parseQueueId(location: string): number {
  const arr = location.split('/').filter(Boolean);
  return +arr[arr.length - 1];
}

/**
 * Trigger a job build
 *
 * If parameters are specified will run `buildWithParameters` otherwise just `build`. Returns queue item id for the triggered build.
 *
 * @param requests
 * @param {string} path - path to the job
 * @param {Record<string, string>} [parameters] - parameters for the job.
 * @param {JobBuildOptions} [options] - build options
 *
 * - `token` - authentication token used to allow unauthenticated users to run the job
 * - `wait` - if `true` will wait until job is completed
 * - `waitForStart` - if `true` will wait for job to start executing
 * - `interval` - interval in milliseconds to specify how often to check job build status. Default `1000`. Only if `wait` or `waitForStart` flags are enabled.
 * - `timeout` - timeout for job build to complete, will throw `Timeout 408` error if not completed in time. By default will wait forever. Only if `wait` or `waitForStart` flags are enabled.
 *
 * @example
 *
 * // trigger a job without parameters
 *
 * const queueId = await jenkins.jobs.build('/my-folder/my-job/');
 *
 * @example
 *
 * // trigger a job with parameters
 *
 * const queueId = await jenkins.jobs.build('job-with-params', { param1: 'value1', param2: 'value2' });
 *
 * @example
 *
 * // trigger a job with parameters, wait for it to complete, then check wheter job result is 'SUCCESS'
 *
 * const jobPath = '/my-folder/my-job/';
 * const queueId = await jenkins.jobs.build(jobPath, { param1: 'value1' }, { wait: true });
 * const buildNumber = (await jenkins.queue.get(queueId)).executable.number;
 * const build = await jenkins.builds.get(jobPath, buildNumber);
 *
 * if (build.result === 'SUCCESS') {
 *   console.log('Success!');
 * }
 *
 */
export const build = async (
  requests: JenkinsRequests,
  path: string,
  parameters?: Record<string, string>,
  options?: JobBuildOptions,
): Promise<number> => {
  const jobPath = JobPath.parse(path).path();
  const token = options?.token;
  let res;
  if (parameters) {
    res = await requests.post(`${jobPath}buildWithParameters`, null, {
      params: { token, ...parameters },
    });
  } else {
    res = await requests.post(`${jobPath}build`, null, {
      params: { token },
    });
  }

  const queueId = parseQueueId(`${res.headers.location}`);
  const needWait = options && (options.waitForStart || options.wait);

  if (!needWait) {
    return queueId;
  }

  const queueItem: JenkinsQueueItem = (await waitWhile<JenkinsQueueItem>(
    () => queueGet(requests, queueId),
    r => !r.data || !r.data.executable,
    options,
  ))!;

  if (options && options.wait) {
    await wait(requests, jobPath, queueItem.executable.number, options);
  }

  if (options && options.waitForStart) {
    await waitForStart(requests, jobPath, queueItem.executable.number, options);
  }

  return queueId;
};
