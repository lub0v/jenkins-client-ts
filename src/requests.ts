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

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { wrapper as cookieJarWrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { JenkinsError } from './error';
import deepmerge from 'deepmerge';

type JenkinsApiRes = {
  data: any;
  headers: Record<string, string | number | boolean>;
  status: number;
  statusText: string;
  config: AxiosRequestConfig;
  request?: any;
};

interface JenkinsCrumbIssuerResponse {
  crumbRequestField: string;
  crumb: string;
}

export interface JenkinsClientOptions {
  baseUrl?: string;
  username?: string;
  password?: string;
  crumbIssuer?: (requests: JenkinsRequests) => Promise<JenkinsCrumbIssuerResponse>;
  config?: AxiosRequestConfig;
}

const DEFAULT_CRUMB_ISSUER = (r: JenkinsRequests) =>
  r.get('/crumbIssuer/api/json').then(res => ({
    crumbRequestField: res.data.crumbRequestField,
    crumb: res.data.crumb,
  }));

const FORBIDDEN_STATUS = 403;
const ERROR_NO_VALID_CRUMB = 'No valid crumb was included in the request';

export class JenkinsRequests {
  private readonly options: JenkinsClientOptions;
  private cookieJar: CookieJar;
  private crumbHeaders: Record<string, string> = {};

  constructor(options: JenkinsClientOptions = {}) {
    this.options = JenkinsRequests.retrieveOptions(options);
    this.cookieJar = new CookieJar();
  }

  public clone(requestConfig?: AxiosRequestConfig) {
    const r = new JenkinsRequests({ ...this.options, config: requestConfig });
    r.cookieJar = this.cookieJar;
    r.crumbHeaders = this.crumbHeaders;
    return r;
  }

  private static retrieveOptions(options: JenkinsClientOptions): JenkinsClientOptions {
    const baseUrl = options.baseUrl ?? 'http://localhost:8080';
    return {
      ...options,
      baseUrl,
    };
  }

  async get(url: string, config?: AxiosRequestConfig): Promise<JenkinsApiRes> {
    return this.request('GET', url, config);
  }

  async exists(url: string, config?: AxiosRequestConfig): Promise<boolean> {
    return this.get(url, config)
      .then(() => true)
      .catch(() => false);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<JenkinsApiRes> {
    return this.request('POST', url, config, data);
  }

  async delete(url: string, config?: AxiosRequestConfig): Promise<JenkinsApiRes> {
    return this.request('DELETE', url, config);
  }

  async postXml(url: string, xml: string, config?: AxiosRequestConfig): Promise<JenkinsApiRes> {
    return this.request('POST', url, config, xml, {
      'content-type': 'text/xml; charset=utf-8',
    });
  }

  async postForm(
    url: string,
    data: { [key: string]: string | number | boolean },
    config?: AxiosRequestConfig,
  ): Promise<JenkinsApiRes> {
    const formUrlEncoded = x =>
      Object.keys(x).reduce((p, c) => `${p}&${c}=${encodeURIComponent(x[c])}`, '');
    return this.request('POST', url, config, formUrlEncoded(data), {
      'content-type': 'application/x-www-form-urlencoded',
    });
  }

  private async processRequest(func: () => Promise<AxiosResponse>): Promise<AxiosResponse> {
    const processAxiosRequest = async () => {
      try {
        return await func();
      } catch (err) {
        throw new JenkinsError(err);
      }
    };

    return processAxiosRequest().catch(async (e: JenkinsError) => {
      if (e.status === FORBIDDEN_STATUS && e.message.includes(ERROR_NO_VALID_CRUMB)) {
        const res = await (this.options.crumbIssuer ?? DEFAULT_CRUMB_ISSUER)(this);
        this.crumbHeaders = { [res.crumbRequestField]: res.crumb };
      }
      return processAxiosRequest();
    });
  }

  private async request(
    method: Method,
    url: string,
    config?: AxiosRequestConfig,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<JenkinsApiRes> {
    return this.processRequest(() =>
      this.getAxios().request(
        deepmerge(deepmerge(this.options.config ?? {}, config ?? {}), {
          method,
          url: url.replace(/\/\//g, '/'),
          data,
          headers: deepmerge(
            deepmerge(this.crumbHeaders, headers ?? {}),
            deepmerge(this.options.config?.headers ?? {}, config?.headers ?? {}),
          ),
        }),
      ),
    );
  }

  private getAxios(): AxiosInstance {
    const options: AxiosRequestConfig = {
      baseURL: this.options.baseUrl,
    };
    if (this.options.username && this.options.password) {
      options.auth = {
        username: this.options.username,
        password: this.options.password,
      };
      options.withCredentials = true;
    }
    return cookieJarWrapper(axios.create({ ...options, jar: this.cookieJar }));
  }
}
