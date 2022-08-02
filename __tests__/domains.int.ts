/* eslint-disable jest/no-standalone-expect */

import { v4 as uuidv4 } from 'uuid';
import { JenkinsClient } from '../src/client';
import { getJenkinsClient } from './helpers/getClient';
import { createFolder } from './helpers/createJobs';
import { getXmlConfig } from './helpers/getConfigXml';
import path from 'path';

describe('domains api', () => {
  const jenkins: JenkinsClient = getJenkinsClient();
  let domainConfigXml;
  let folder;

  beforeAll(async () => {
    folder = await createFolder(uuidv4());
    const xml = getXmlConfig('domain-config.xml', path.resolve(__dirname));
    domainConfigXml = xml.replace('<name>github</name>', '<name>github_domain</name>');
  });

  afterAll(async () => {
    await jenkins.jobs.delete(folder);
  });

  describe('credentials', () => {
    its()
      .each([
        {
          desc: 'system domain',
          credential: () => jenkins.credentials.system(),
        },
        {
          desc: 'folder domain',
          credential: () => jenkins.credentials.folder(folder),
        },
        {
          desc: 'user domain',
          credential: () => jenkins.credentials.user('admin'),
        },
      ])
      .run(async t => {
        const domain = 'github_domain';
        await t.credential().domains.create(domainConfigXml);

        const res = await t.credential().domains.get(domain);
        expect(res).toBeTruthy();
        expect(res.displayName).toEqual(domain);
        expect(res.urlName).toEqual(domain);

        const configJson = await t.credential().domains.configJson(domain);
        expect(configJson).toBeTruthy();
        const conf = configJson['com.cloudbees.plugins.credentials.domains.Domain'];
        expect(conf.name).toEqual(domain);
        expect(Object.keys(conf.specifications).length).toEqual(1);

        const configXml = await t.credential().domains.configXml(domain);
        expect(configXml).toBeTruthy();
        expect(configXml).toContain(`<name>${domain}</name>`);

        const listRes = await t.credential().domains.list();
        expect(listRes).toBeTruthy();
        expect(listRes.length).toBeGreaterThanOrEqual(2);
        expect(listRes.filter(g => g.urlName === domain)).toBeTruthy();

        expect(await t.credential().domains.exists(domain)).toBeTruthy();

        const domainUpdated = 'github_updated';
        const updated = domainConfigXml.replace(domain, domainUpdated);

        await t.credential().domains.setConfig(domain, updated);

        expect(await t.credential().domains.exists(domain)).toBeFalsy();
        expect(await t.credential().domains.exists(domainUpdated)).toBeTruthy();

        await t.credential().domains.delete(domainUpdated);

        expect(await t.credential().domains.exists(domainUpdated)).toBeFalsy();
      });
  });
});
