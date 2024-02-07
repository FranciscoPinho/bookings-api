import request from 'supertest';

import app from '@src/server';

describe('Health Check API endpoints', () => {
  it('GET / - success', async () => {
    const response = await request(app).get('/healthcheck');
    const result = response.body;

    expect(response.statusCode).toEqual(200);
    expect(result.message).toEqual('Service is healthy');
  });
});
