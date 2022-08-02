/* eslint-disable jest/no-standalone-expect */
import { v4 as uuidv4 } from 'uuid';
import { JenkinsClient } from '../src/client';
import { getJenkinsClient } from './helpers/getClient';
import { createFolder } from './helpers/createJobs';
import { getXmlConfig } from './helpers/getConfigXml';
import * as path from 'path';

describe('credentials api', () => {
  const jenkins: JenkinsClient = getJenkinsClient();
  const CREDENTIAL_ID = 'credential-name';

  let credentialConfigXml;
  let domainConfigXml;
  let folder;

  beforeAll(async () => {
    credentialConfigXml = getXmlConfig('credential-config.xml', path.resolve(__dirname));
    domainConfigXml = getXmlConfig('domain-config.xml', path.resolve(__dirname));
    folder = await createFolder(uuidv4());
    await jenkins.credentials.folder(folder).domains.create(domainConfigXml);
    await jenkins.credentials.user('admin').domains.create(domainConfigXml);
  });

  afterAll(async () => {
    await jenkins.credentials.folder(folder).domains.delete('github');
    await jenkins.credentials.user('admin').domains.delete('github');
    await jenkins.jobs.delete(folder);
  });

  describe('credentials', () => {
    its()
      .each([
        {
          desc: 'system creds with _ domain',
          domain: '_',
          credential: () => jenkins.depth(2).credentials.system(),
        },
        {
          desc: 'folder creds with domain',
          domain: 'github',
          credential: () => jenkins.depth(2).credentials.folder(folder),
        },
        {
          desc: 'user creds without domain',
          domain: undefined,
          credential: () => jenkins.depth(2).credentials.user('admin'),
        },
        {
          desc: 'user creds with domain',
          domain: 'github',
          credential: () => jenkins.depth(2).credentials.user('admin'),
        },
      ])
      .run(async t => {
        await t.credential().create(credentialConfigXml, t.domain);
        expect(await t.credential().exists(CREDENTIAL_ID, t.domain)).toBeTruthy();

        const configJson = await t.credential().configJson(CREDENTIAL_ID, t.domain);
        expect(configJson).toBeTruthy();
        const cgf =
          configJson['com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl'];
        expect(cgf.scope).toEqual('GLOBAL');
        expect(cgf.description).toEqual('some description');
        expect(cgf.password['secret-redacted']).toEqual('');
        expect(cgf.username).toEqual('username');

        const configXml = await t.credential().configXml(CREDENTIAL_ID, t.domain);
        expect(configXml).toBeTruthy();
        expect(configXml).toContain(`<id>${CREDENTIAL_ID}</id>`);
        expect(configXml).toContain('<usernameSecret>false</usernameSecret>');

        const cred = await t.credential().get(CREDENTIAL_ID, t.domain);
        expect(cred).toBeTruthy();
        expect(cred.description).toEqual('some description');

        const list = await t.credential().list(t.domain);
        expect(list).toBeTruthy();
        expect(list.length).toEqual(1);
        expect(list[0].description).toEqual('some description');

        const updated = credentialConfigXml.replace(
          '<username>username</username>',
          '<username>username_updated</username>',
        );

        await t.credential().setConfig(CREDENTIAL_ID, updated, t.domain);

        const cfgJson = await t.credential().configJson(CREDENTIAL_ID, t.domain);
        expect(cfgJson).toBeTruthy();
        expect(
          cfgJson['com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl']
            .username,
        ).toEqual('username_updated');

        await t.credential().delete(CREDENTIAL_ID, t.domain);

        expect(await t.credential().exists(CREDENTIAL_ID, t.domain)).toBeFalsy();
      });
  });
});
