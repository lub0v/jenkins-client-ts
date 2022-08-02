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

// eslint-disable-next-line max-classes-per-file
import { JenkinsRequests } from '../requests';
import { get } from './jobs.get';
import { enable } from './jobs.enable';
import { exists } from './jobs.exists';
import { disable } from './jobs.disable';
import { list } from './jobs.list';
import { configXml } from './jobs.configXml';
import { configJson } from './jobs.configJson';
import { create } from './jobs.create';
import { deleteJob } from './jobs.delete';
import { build } from './jobs.build';
import { copy } from './jobs.copy';
import { JenkinsJob, JobBuildOptions } from '../types';
import { setConfig } from './jobs.setConfig';

export class JenkinsJobsApi {
  private requests: JenkinsRequests;

  constructor(requests: JenkinsRequests) {
    this.requests = requests;
  }

  get(path: string): Promise<JenkinsJob> {
    return get(this.requests, path);
  }

  exists(path: string): Promise<boolean> {
    return exists(this.requests, path);
  }

  list(path: string, recursive?: boolean): Promise<JenkinsJob[]> {
    return list(this.requests, path, recursive);
  }

  create(path: string, name: string, xmlContent: string): Promise<void> {
    return create(this.requests, path, name, xmlContent);
  }

  setConfig(path: string, xmlContent: string): Promise<void> {
    return setConfig(this.requests, path, xmlContent);
  }

  delete(path: string): Promise<void> {
    return deleteJob(this.requests, path);
  }

  copy(fromPath: string, toPath: string): Promise<void> {
    return copy(this.requests, fromPath, toPath);
  }

  build(
    path: string,
    parameters?: Record<string, string>,
    options?: JobBuildOptions,
  ): Promise<number> {
    return build(this.requests, path, parameters, options);
  }

  disable(path: string): Promise<any> {
    return disable(this.requests, path);
  }

  enable(path: string): Promise<any> {
    return enable(this.requests, path);
  }

  configJson(path: string): Promise<any> {
    return configJson(this.requests, path);
  }

  configXml(path: string): Promise<string> {
    return configXml(this.requests, path);
  }
}
