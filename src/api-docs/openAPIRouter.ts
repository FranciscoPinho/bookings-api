import express, { Request, Response, Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import { generateOpenAPIDocument } from './openAPIDocumentGenerator';

export const openAPIRouter: Router = (() => {
  const router = express.Router();
  const openAPIDocument = generateOpenAPIDocument();

  router.use('/docs', swaggerUi.serve, swaggerUi.setup(openAPIDocument));

  return router;
})();
