import { v4 as uuidv4 } from 'uuid';
import { JenkinsClient } from '../src/client';
import { getJenkinsClient } from './helpers/getClient';
import { createFolder, createJob } from './helpers/createJobs';
import { JenkinsView } from '../src/types';
import { getXmlConfig } from './helpers/getConfigXml';
import * as path from 'path';

describe('view', () => {
  const TEST_LIST_VIEW = 'TestListView';
  const TEST_MY_VIEW = 'TestMyView';
  const jenkins: JenkinsClient = getJenkinsClient();
  let folder;
  let folder2;
  let jobPath;

  beforeAll(async () => {
    folder = await createFolder(uuidv4());
    jobPath = await createJob(folder, { name: 'myJob' });
  });

  afterAll(async () => {
    await jenkins.jobs.delete(folder);
  });

  it('get "All" view from root', async () => {
    const rootView: JenkinsView = await jenkins.views.get('/', 'All');
    expect(rootView).toBeTruthy();
    expect(rootView.jobs.length).toBeGreaterThanOrEqual(1);
  });

  it('get "All" view from folder', async () => {
    const folderView = await jenkins.views.get(folder, 'All');
    expect(folderView).toBeTruthy();
    expect(folderView.jobs.length).toEqual(1);
  });

  it('view should not exist', async () => {
    expect(await jenkins.views.exists('/', TEST_LIST_VIEW)).toBeFalsy();
  });

  it('create ListView', async () => {
    await jenkins.views.create(folder, TEST_LIST_VIEW, 'ListView');

    const view = await jenkins.views.get(folder, TEST_LIST_VIEW);
    expect(view).toBeTruthy();
    expect(view.jobs.length).toBeFalsy();
    expect(view.name).toEqual(TEST_LIST_VIEW);
    expect(view._class).toEqual('hudson.model.ListView');
  });

  it('update ListView', async () => {
    const config = await jenkins.views.configJson(folder, TEST_LIST_VIEW);
    expect(config).toBeTruthy();
    const listView = config['hudson.model.ListView'];
    expect(listView.recurse).toBeFalsy();

    const updateXml = getXmlConfig('view-update.xml', path.resolve(__dirname));
    await jenkins.views.setConfig(folder, TEST_LIST_VIEW, updateXml);

    const configUpdate = await jenkins.views.configJson(folder, TEST_LIST_VIEW);
    expect(configUpdate).toBeTruthy();

    const listViewUpdated = configUpdate['hudson.model.ListView'];
    expect(listViewUpdated.recurse).toBeTruthy();

    const xmlConfig = await jenkins.views.configXml(folder, TEST_LIST_VIEW);
    expect(xmlConfig).toBeTruthy();
    expect(xmlConfig).toContain('<hudson.model.ListView>');
  });

  it('create MyView', async () => {
    await jenkins.views.create(folder, TEST_MY_VIEW, 'MyView');

    const view = await jenkins.views.get(folder, TEST_MY_VIEW);
    expect(view).toBeTruthy();
    expect(view.jobs.length).toEqual(1);
    expect(view.jobs).toEqual([
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        name: 'myJob',
        url: `http://localhost:8080/job/${folder}/job/myJob/`,
        color: 'notbuilt',
      },
    ]);
    expect(view.name).toEqual(TEST_MY_VIEW);
    expect(view._class).toEqual('hudson.model.MyView');
  });

  it('list views', async () => {
    const views: JenkinsView[] = await jenkins.views.list(folder);
    expect(views).toBeTruthy();
    expect(views.length).toEqual(3);
  });

  it('should throw error if cannot list view', async () => {
    await expect(jenkins.views.list(jobPath)).rejects.toThrow(
      `Cannot get views for path ${jobPath}.`,
    );
  });

  it('add job to view', async () => {
    folder2 = await createFolder(uuidv4(), undefined, folder);
    const jobPath2 = await createJob(folder2, { name: 'job2' });

    await jenkins.views.addJob(folder, TEST_LIST_VIEW, 'myJob');
    await jenkins.views.addJob(folder, TEST_LIST_VIEW, jobPath2);

    const viewData = await jenkins.views.get(folder, TEST_LIST_VIEW);
    expect(viewData).toBeTruthy();
    expect(viewData.jobs.length).toEqual(2);
    expect(viewData.jobs.find(j => j.name === 'myJob')).toBeTruthy();
    expect(viewData.jobs.find(j => j.name === 'job2')).toBeTruthy();
  });

  it('remove job from view', async () => {
    await jenkins.views.removeJob(folder, TEST_LIST_VIEW, 'myJob');
    const viewData = await jenkins.views.get(folder, TEST_LIST_VIEW);
    expect(viewData.jobs.length).toEqual(1);
    expect(viewData.jobs.find(j => j.name === 'job2')).toBeTruthy();
    await jenkins.views.removeJob(folder, TEST_LIST_VIEW, `${folder2}/job2`);
  });

  it('delete views', async () => {
    await jenkins.views.delete(folder, TEST_LIST_VIEW);
    await jenkins.views.delete(folder, TEST_MY_VIEW);

    expect(await jenkins.views.exists('/', TEST_LIST_VIEW)).toBeFalsy();
    expect(await jenkins.views.exists('/', TEST_MY_VIEW)).toBeFalsy();
  });
});
