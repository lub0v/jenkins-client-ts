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

import { AxiosError } from 'axios';

type ErrorType = AxiosError | any;

export class JenkinsError extends Error {
  readonly status: number | string;
  readonly #error: ErrorType;

  constructor(err: ErrorType) {
    super(JenkinsError.getMessage(err));
    this.status = err.response?.status || 'unknown';
    this.#error = err;
  }

  private static getMessage(err: ErrorType): string {
    const msg =
      err.response?.data?.message ||
      err.response?.headers?.['x-error'] ||
      err.message ||
      err.response?.statusText ||
      'Unknown error';
    const url = err.config?.url || 'unknown';
    const method = (err.config?.method || '').toUpperCase();
    const status = err.response?.status || 'unknown';
    return `${method} request for url "${url}" failed with status "${status}" and error: "${msg}"`;
  }

  get error(): ErrorType {
    return this.#error;
  }
}
