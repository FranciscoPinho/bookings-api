import { API_KEY_HEADER } from '@src/utils/constants';
import { rateLimit } from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // Limit each api key to 100 requests per `window` (here, per minute).
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req, res) => req.header(API_KEY_HEADER) || '',
});

export default rateLimiter;
