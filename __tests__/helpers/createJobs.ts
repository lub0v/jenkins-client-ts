import path from 'path';
import { getJenkinsClient } from './getClient';
import { getXmlConfig } from './getConfigXml';

type JobWithConfig = {
  name?: string;
  config?: string;
  script?: string;
};

export async function createFolder(
  folderName: string,
  p = path.resolve(__dirname, '..'),
  folderPath = '/',
): Promise<string> {
  const jenkins = getJenkinsClient();
  await jenkins.jobs.create(folderPath, folderName, getXmlConfig('folder.xml', p));
  if (!folderPath || folderPath === '/') {
    return folderName;
  }
  return `${folderPath}/${folderName}`.replace(/\/\//g, '/');
}

export async function createJob(
  folderPath: string,
  job: JobWithConfig = {},
  p = path.resolve(__dirname, '..'),
): Promise<string> {
  const jenkins = getJenkinsClient();
  const configXml = getXmlConfig(job.config ?? 'job.xml', p);
  const script = job.script ?? 'echo "hello";';

  const name = job.name ?? 'job1';
  const regex = new RegExp('<script/>', 'imgs');
  const newValue = configXml.replace(regex, `<script>${script}</script>`);

  await jenkins.jobs.create(folderPath, name, newValue);
  return `${folderPath}/${name}`;
}
