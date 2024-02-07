import { User } from '@modules/users/userModel';
import { userService } from '@modules/users/userService';
import { API_KEY_HEADER } from '@src/utils/constants';
import { handleErrorResponse } from '@src/utils/errors';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const authenticateKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header(API_KEY_HEADER);
  if (!apiKey) {
    return handleErrorResponse(res, `Requires API Key auth through ${API_KEY_HEADER} header`, StatusCodes.FORBIDDEN);
  }
  const user = await userService.findByApiKey(apiKey as string);
  if (!user) {
    return handleErrorResponse(res, 'Invalid API Key', StatusCodes.FORBIDDEN);
  }
  req.user = user as User;
  next();
};
