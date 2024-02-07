import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import helmet from 'helmet';
import { IncomingMessage } from 'http';
import morgan from 'morgan';
import path from 'path';

import { openAPIRouter } from '@api-docs/openAPIRouter';
import errorHandler from '@src/middleware/errorHandler';
import rateLimiter from '@src/middleware/rateLimiter';
import { CORS_ORIGIN } from '@src/utils/env';
import { healthCheckRouter } from '@modules/healthCheck/healthCheckRouter';
import { User } from '@modules/users/userModel';
import { authenticateKey } from './middleware/authHandler';
import { bookingRouter } from '@modules/bookings/bookingRouter';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

// Extend Express Request Object with Custom Attributes
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
      user: Pick<User, 'id' | 'email' | 'api_key' | 'role'>;
    }
  }
}

const app: Express = express();

// Middlewares
app.use(cors({ origin: [CORS_ORIGIN], credentials: true })); // We could get an allow list of origins from some other data store
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  next();
});

morgan.token('id', function getId(req: IncomingMessage & { id: string }) {
  return req.id;
});

app.use(express.json());
app.use(morgan(':method :url ReqID: :id :response-time ms'));
// Swagger UI
app.use(openAPIRouter);
// Routes
app.use('/healthcheck', healthCheckRouter);
app.use(authenticateKey);
app.use('/bookings', bookingRouter);

// Error handlers
app.use(errorHandler());

export default app;
