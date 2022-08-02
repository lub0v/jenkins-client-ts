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
import { JenkinsJob } from '../types';
import { JobPath } from '../utils/jobPath';
import { isFolder, isOrganizationFolder } from '../typeguards';

/**
 * List jobs
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} path - path to the folder
 * @param {boolean} [recursive] - whether to list jobs in the subfolders recursively
 *
 * @example
 *
 * const res = await jenkins.jobs.list('/');
 *
 * @example Example result:
 *
 * [
 *   {
 *     _class: 'com.cloudbees.hudson.plugins.folder.Folder',
 *     name: 'folder',
 *     url: 'http://localhost:8080/job/folder/',
 *   },
 *   {
 *     _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
 *     name: 'job1',
 *     url: 'http://localhost:8080/job/job1/',
 *     color: 'notbuilt',
 *   }
 * ]
 *
 * @example
 *
 * const res = await jenkins.jobs.list('/', true);
 *
 * @example Example result:
 *
 * [
 *   {
 *     _class: 'com.cloudbees.hudson.plugins.folder.Folder',
 *     name: 'folder',
 *     url: 'http://localhost:8080/job/folder/',
 *   },
 *   {
 *     _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
 *     name: 'job2',
 *     url: 'http://localhost:8080/job/folder/job/job2',
 *   },
 *   {
 *     _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
 *     name: 'job1',
 *     url: 'http://localhost:8080/job/job1/',
 *     color: 'notbuilt',
 *   }
 * ]
 *
 */
export const list = async (
  requests: JenkinsRequests,
  path: string,
  recursive?: boolean,
): Promise<JenkinsJob[]> => {
  const res = await requests.get(`${JobPath.parse(path).path()}api/json`);
  const { jobs } = res.data;
  if (!jobs || !jobs.length) {
    return [];
  }

  if (!recursive) {
    return jobs;
  }

  const isJobFolder = (j: JenkinsJob) => isFolder(j) || isOrganizationFolder(j);

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<JenkinsJob[]>(async resolve => {
    const promises = jobs.map(async (j: JenkinsJob) =>
      isJobFolder(j) ? [j, ...(await list(requests, j.url, true))] : [j],
    );

    const results: JenkinsJob[] = [];
    const allResults: JenkinsJob[][] = await Promise.all(promises);
    for (let i = 0; i < allResults.length; i += 1) {
      results.push(...allResults[i]);
    }
    resolve(results);
  });
};
