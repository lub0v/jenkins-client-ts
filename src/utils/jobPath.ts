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

import urlParse from 'url';

/**
 * Normalises path to jenkins job to use in API calls
 *
 * Jenkins urls for jobs or folders look like this https://build.jenkins.net/job/my-folder/job/my-job/.
 *
 * In order to pass valid Jenkins URL to API call we must correct from whatever user supplied.
 *
 * @param {string} path - path to the jenkins job/folder. Can be in the format `/job/my-folder/job/my-job/` or `/my-folder/my-job/` or the full URL.
 * Note that if your job or folder named "job" then you must provide full path, e.g. /job/my/job/job.
 *
 * @example
 *
 * JobPath.parse('/job/my-job-name').path() -> '/job/my-job-name/'
 * JobPath.parse('/my-job/another').path() -> '/job/my-job/job/another/'
 * JobPath.parse('http://localhost:8080/one/two/job/three').path() -> '/job/three'
 * JobPath.parse('http://localhost:8080/job/one').path() -> '/job/one'
 * JobPath.parse('/job').path() -> ''
 * JobPath.parse('/job/job').path() -> '/job/job'
 *
 */

export class JobPath {
  private readonly parts: string[];

  public static parse(path: string | number): JobPath {
    return new JobPath(path);
  }

  constructor(path: string | number) {
    const parsed = urlParse.parse(`${path}`);
    const parts = (parsed.pathname || '').split('/').filter(Boolean);
    const jobParts: string[] = [];
    if (parts.includes('job')) {
      let push = false;
      for (const el of parts) {
        const isDelimeter = el === 'job' && !push;
        if (isDelimeter) {
          push = true;
        } else if (push) {
          jobParts.push(el);
          push = false;
        } else if (jobParts.length) {
          break;
        }
      }
    } else if (!parsed.host) {
      jobParts.push(...parts);
    }
    this.parts = jobParts;
  }

  public name(): string {
    return this.parts.length ? this.parts[this.parts.length - 1] : '';
  }

  public path(): string {
    return JobPath.constructPath(this.parts);
  }

  public prettyPath(): string {
    return this.parts.join('/');
  }

  public parent(): JobPath {
    return new JobPath(
      JobPath.constructPath(
        this.parts.length > 1 ? this.parts.slice(0, this.parts.length - 1) : [],
      ),
    );
  }

  private static constructPath(parts: string[]): string {
    return parts.length ? `/job/${parts.join('/job/')}/` : '';
  }
}
