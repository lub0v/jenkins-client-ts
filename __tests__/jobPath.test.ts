/* eslint-disable jest/no-standalone-expect */
import { JobPath } from '../src/utils/jobPath';

describe('job path', () => {
  describe('job path with details', () => {
    its()
      .each([
        { input: '', expected: { name: '', path: '', prettyPath: '', folder: '' } },
        { input: '/', expected: { name: '', path: '', prettyPath: '', folder: '' } },
        { input: '//', expected: { name: '', path: '', prettyPath: '', folder: '' } },
        { input: '///', expected: { name: '', path: '', prettyPath: '', folder: '' } },
        {
          input: 'https://jenkins.company.com/controller/job/some/job/other/',
          expected: {
            name: 'other',
            path: '/job/some/job/other/',
            prettyPath: 'some/other',
            folder: '/job/some/',
          },
        },
        {
          input: 'http://localhost:8080/job/aa/job/bb',
          expected: {
            name: 'bb',
            path: '/job/aa/job/bb/',
            prettyPath: 'aa/bb',
            folder: '/job/aa/',
          },
        },
        {
          input: 'http://localhost:8080/somecontroller/job/aa/',
          expected: {
            name: 'aa',
            path: '/job/aa/',
            prettyPath: 'aa',
            folder: '',
          },
        },
        {
          input: 'http://localhost:8080/somecontroller/',
          expected: {
            name: '',
            path: '',
            prettyPath: '',
            folder: '',
          },
        },
        {
          input: '/job/aa/',
          expected: {
            name: 'aa',
            path: '/job/aa/',
            prettyPath: 'aa',
            folder: '',
          },
        },
        {
          input: '/my-job',
          expected: {
            name: 'my-job',
            path: '/job/my-job/',
            prettyPath: 'my-job',
            folder: '',
          },
        },
        {
          input: 'my-job',
          expected: {
            name: 'my-job',
            path: '/job/my-job/',
            prettyPath: 'my-job',
            folder: '',
          },
        },
      ])
      .run(it => {
        const parsed = JobPath.parse(it.input);
        expect(parsed.path()).toEqual(it.expected.path);
        expect(parsed.prettyPath()).toEqual(it.expected.prettyPath);
        expect(parsed.name()).toEqual(it.expected.name);
        expect(parsed.parent().path()).toEqual(it.expected.folder);
      });
  });

  describe('job path', () => {
    its()
      .each([
        { input: '', expected: '' },
        { input: '/', expected: '' },
        { input: '//', expected: '' },
        { input: '///', expected: '' },
        { input: 'my-job-name', expected: '/job/my-job-name/' },
        { input: 'jobToDelete', expected: '/job/jobToDelete/' },
        { input: 'job/my-job-name', expected: '/job/my-job-name/' },
        { input: '/job/my-job-name/', expected: '/job/my-job-name/' },
        { input: '/job/my-job-name', expected: '/job/my-job-name/' },
        { input: '/my-job-name/', expected: '/job/my-job-name/' },
        { input: '/my-job/another', expected: '/job/my-job/job/another/' },
        { input: '/my-job/job/another', expected: '/job/another/' },
        { input: '/my-job/job/job/another', expected: '/job/job/' },
        { input: '/my/job/job/job/another/job/job', expected: '/job/job/job/another/job/job/' },
        { input: 'http://localhost:8080/job/my-job', expected: '/job/my-job/' },
        { input: 'https://localhost:8080/my-job', expected: '' },
        { input: 'http://localhost:8080/my-job/another', expected: '' },
        { input: 1644475644755, expected: '/job/1644475644755/' },
        { input: '1644475644755', expected: '/job/1644475644755/' },
        { input: '😀', expected: '/job/😀/' },
      ])
      .run(it => {
        expect(JobPath.parse(it.input).path()).toEqual(it.expected);
      });
  });

  // if job name is "job" then user must provide the full path, e.g. /job/job
  describe('job path special case when job named "job"', () => {
    its()
      .each([
        {
          input: 'job',
          expected: { name: '', path: '', prettyPath: '', folder: '' },
        },
        {
          input: '/job/',
          expected: { name: '', path: '', prettyPath: '', folder: '' },
        },
        {
          input: '/my/job',
          expected: {
            name: '',
            path: '',
            prettyPath: '',
            folder: '',
          },
        },
        {
          desc: 'when job named "job" is at the end of the path',
          input: '/some/folder/with/my/job',
          expected: {
            name: '',
            path: '',
            prettyPath: '',
            folder: '',
          },
        },
        {
          input: '/some/folder/job/my-job',
          expected: {
            name: 'my-job',
            path: '/job/my-job/',
            prettyPath: 'my-job',
            folder: '',
          },
        },
        {
          input: '/job/job/',
          expected: {
            name: 'job',
            path: '/job/job/',
            prettyPath: 'job',
            folder: '',
          },
        },
        {
          input: '/job/my/job/other/job/job/',
          expected: {
            name: 'job',
            path: '/job/my/job/other/job/job/',
            prettyPath: 'my/other/job',
            folder: '/job/my/job/other/',
          },
        },
        {
          input: 'controller/job/my/job/other/job/job/',
          expected: {
            name: 'job',
            path: '/job/my/job/other/job/job/',
            prettyPath: 'my/other/job',
            folder: '/job/my/job/other/',
          },
        },
      ])
      .run(it => {
        const parsed = JobPath.parse(it.input);
        expect(parsed.path()).toEqual(it.expected.path);
        expect(parsed.prettyPath()).toEqual(it.expected.prettyPath);
        expect(parsed.name()).toEqual(it.expected.name);
        expect(parsed.parent().path()).toEqual(it.expected.folder);
      });
  });
});
