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

import { JenkinsClientOptions, JenkinsRequests } from './requests';
import { JenkinsJobsApi } from './jobs/jobs';
import { JenkinsBuildsApi } from './builds/builds';
import { JenkinsLabelsApi } from './labels/labels';
import { JenkinsQueueApi } from './queue/queue';
import { JenkinsPluginsApi } from './plugins/plugins';
import { JenkinsNodesApi } from './nodes/nodes';
import { JenkinsViewsApi } from './views/views';
import { JenkinsCredentialsApi } from './credentials/credentials';
import { JenkinsUsersApi } from './users/users';
import { AxiosRequestConfig } from 'axios';

export class JenkinsClient {
  readonly requests: JenkinsRequests;
  readonly jobs: JenkinsJobsApi;
  readonly builds: JenkinsBuildsApi;
  readonly queue: JenkinsQueueApi;
  readonly labels: JenkinsLabelsApi;
  readonly nodes: JenkinsNodesApi;
  readonly plugins: JenkinsPluginsApi;
  readonly views: JenkinsViewsApi;
  readonly credentials: JenkinsCredentialsApi;
  readonly users: JenkinsUsersApi;

  constructor(options: JenkinsClientOptions = {}, requests?: JenkinsRequests) {
    this.requests = requests ?? new JenkinsRequests(options);
    this.jobs = new JenkinsJobsApi(this.requests);
    this.builds = new JenkinsBuildsApi(this.requests);
    this.queue = new JenkinsQueueApi(this.requests);
    this.labels = new JenkinsLabelsApi(this.requests);
    this.nodes = new JenkinsNodesApi(this.requests);
    this.plugins = new JenkinsPluginsApi(this.requests);
    this.views = new JenkinsViewsApi(this.requests);
    this.credentials = new JenkinsCredentialsApi(this.requests);
    this.users = new JenkinsUsersApi(this.requests);
  }

  depth(depth: number): JenkinsClient {
    return this.config({ params: { depth } });
  }

  tree(tree: string): JenkinsClient {
    return this.config({ params: { tree } });
  }

  config(requestConfig: AxiosRequestConfig): JenkinsClient {
    return new JenkinsClient({}, this.requests.clone(requestConfig));
  }

  getVersion(): Promise<string> {
    return this.requests.get('/api').then(res => `${res.headers['x-jenkins']}`);
  }
}
