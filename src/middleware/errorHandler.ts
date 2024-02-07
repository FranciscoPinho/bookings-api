import { handleErrorResponse } from '@src/utils/errors';
import { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const unexpectedRequest: RequestHandler = (_req, res) => {
  return handleErrorResponse(res, 'Unknown route', StatusCodes.NOT_FOUND);
};

const defaultErrorRequestHandler: ErrorRequestHandler = (err, _req, res, next) => {
  console.log(err);
  res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
};

export default () => [unexpectedRequest, defaultErrorRequestHandler];
