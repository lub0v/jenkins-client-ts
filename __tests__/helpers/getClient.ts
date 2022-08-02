import { JenkinsClient } from '../../src/client';

export function getJenkinsClient(): JenkinsClient {
  return new JenkinsClient({
    baseUrl: 'http://localhost:8080',
    username: 'admin',
    password: 'admin',
  });
}
