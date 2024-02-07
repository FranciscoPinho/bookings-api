import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from '@src/utils/zodExtended';

import { createApiResponse } from '@api-docs/openAPIResponseBuilders';

export const healthCheckRegistry = new OpenAPIRegistry();

export const healthCheckRouter: Router = (() => {
  const router = express.Router();

  healthCheckRegistry.registerPath({
    method: 'get',
    path: '/healthcheck',
    tags: ['Health Check'],
    responses: createApiResponse(z.object({ message: z.string() }), 'Success'),
  });

  router.get('/', (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).send({ message: 'Service is healthy' });
  });

  return router;
})();
