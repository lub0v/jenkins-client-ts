import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { JenkinsRequests } from '../src/requests';

describe('requests', () => {
  let axiosMock;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    axiosMock.onGet('http://localhost:8080/test').reply(200, {});
    axiosMock.onPost('http://localhost:8080/test').reply(200, {});
  });

  it('should use baseUrl', async () => {
    const req = new JenkinsRequests({
      baseUrl: 'https://myUrl.com',
    });
    const data = { hello: 'there' };
    axiosMock.onGet('https://myUrl.com/test').reply(200, data);
    const res = await req.get('/test');
    expect(res.data).toEqual(data);
  });

  it('should use credentials', async () => {
    const req = new JenkinsRequests({
      username: 'user',
      password: 'pass',
    });
    const res = await req.get('/test');
    expect(res.config.auth?.username).toEqual('user');
    expect(res.config.auth?.password).toEqual('pass');
    expect(res.config.withCredentials).toBeTruthy();
  });

  describe('config overrides', () => {
    it('local config should precede global', async () => {
      const req = new JenkinsRequests({
        username: 'user',
        password: 'pass',
        config: {
          params: {
            param: 'globalVal',
          },
        },
      });

      const res = await req.get('/test', { params: { param: 'local' } });
      expect(res.config.params.param).toEqual('local');
    });

    it('local headers should precede global headers', async () => {
      const req = new JenkinsRequests({
        username: 'user',
        password: 'pass',
        config: {
          headers: {
            customHeader: 'globalVal',
          },
        },
      });

      const res = await req.get('/test', {
        headers: {
          customHeader: 'local',
        },
      });
      expect(res.config.headers!.customHeader).toEqual('local');
    });

    it('should use provided headers', async () => {
      const req = new JenkinsRequests({
        config: {
          headers: {
            'x-my-custom': 'value',
          },
        },
      });
      const res = await req.get('/test');
      expect(res.config.headers!['x-my-custom']).toEqual('value');
    });

    it('should override xml headers even for postXml if user wants so', async () => {
      const req = new JenkinsRequests({
        config: {
          headers: {
            'content-type': 'text/xml; charset=utf-8 custom',
          },
        },
      });
      const res = await req.postXml('/test', '<config/>');
      expect(res.config.headers!['Content-Type']).toEqual('text/xml; charset=utf-8 custom');
    });

    it('should override xml headers for postXml if user wants so', async () => {
      const req = new JenkinsRequests({
        config: {
          headers: {
            'content-type': 'text/xml; charset=utf-8 custom global',
          },
        },
      });
      const res = await req.postXml('/test', '<config/>', {
        headers: {
          'content-type': 'text/xml; charset=utf-8 custom local',
        },
      });
      expect(res.config.headers!['Content-Type']).toEqual('text/xml; charset=utf-8 custom local');
    });
  });

  describe('xml & form', () => {
    let requests;

    beforeEach(() => {
      requests = new JenkinsRequests();
      axiosMock.onPost('http://localhost:8080/test').reply(200, {});
    });

    it('should add xml headers to postXml request', async () => {
      const res = await requests.postXml('/test', '<data/>');
      expect(res.config.headers['Content-Type']).toEqual('text/xml; charset=utf-8');
    });

    it('should add custom headers to postXml request', async () => {
      const res = await requests.postXml('/test', '<data/>', {
        headers: {
          'x-custom': 'value',
        },
      });
      expect(res.config.headers['Content-Type']).toEqual('text/xml; charset=utf-8');
      expect(res.config.headers['x-custom']).toEqual('value');
    });

    it('should add form headers to postForm request', async () => {
      const res = await requests.postForm('/test', { key: 'value' });
      expect(res.config.headers['Content-Type']).toEqual('application/x-www-form-urlencoded');
      expect(res.config.data).toEqual('&key=value');
    });

    it('should add custom headers to postForm request', async () => {
      const res = await requests.postForm('/test', '<data/>', {
        headers: {
          'x-custom': 'value',
        },
      });
      expect(res.config.headers['Content-Type']).toEqual('application/x-www-form-urlencoded');
      expect(res.config.headers['x-custom']).toEqual('value');
    });
  });
});
