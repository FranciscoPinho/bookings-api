import { Response } from 'express';

export class BookedParkingSpotError extends Error {}
export const handleErrorResponse = (res: Response, message: string, code: number) =>
  res.status(code).send({ error: { message, code } });
