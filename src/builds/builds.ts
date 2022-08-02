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
import { get } from './builds.get';
import { log } from './builds.log';
import { LogReadableStream, logStream } from './builds.logStream';
import {
  JenkinsBuild,
  JenkinsBuildAbortType,
  JenkinsBuildWaitOptions,
  JenkinsLog,
  LogOptions,
  LogStreamOptions,
} from '../types';
import { wait } from './builds.wait';
import { waitForStart } from './builds.waitForStart';
import { abort } from './builds.abort';
import { deleteBuild } from './builds.delete';

export class JenkinsBuildsApi {
  private requests: JenkinsRequests;

  constructor(requests: JenkinsRequests) {
    this.requests = requests;
  }

  get(path: string, buildNumber: number): Promise<JenkinsBuild> {
    return get(this.requests, path, buildNumber);
  }

  delete(path: string, buildNumber: number): Promise<void> {
    return deleteBuild(this.requests, path, buildNumber);
  }

  wait(
    path: string,
    buildNumber: number,
    options?: JenkinsBuildWaitOptions,
  ): Promise<JenkinsBuild> {
    return wait(this.requests, path, buildNumber, options);
  }

  waitForStart(
    path: string,
    buildNumber: number,
    options?: JenkinsBuildWaitOptions,
  ): Promise<JenkinsBuild> {
    return waitForStart(this.requests, path, buildNumber, options);
  }

  log(path: string, buildNumber: number, options?: LogOptions): Promise<JenkinsLog> {
    return log(this.requests, path, buildNumber, options);
  }

  logStream(path: string, buildNumber: number, options?: LogStreamOptions): LogReadableStream {
    return logStream(this.requests, path, buildNumber, options);
  }

  abort(
    path: string,
    buildNumber: number,
    type: JenkinsBuildAbortType = JenkinsBuildAbortType.STOP,
  ): Promise<void> {
    return abort(this.requests, path, buildNumber, type);
  }
}
