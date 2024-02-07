import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import querystring from 'node:querystring';
import { StatusCodes } from 'http-status-codes';
import { z } from '@src/utils/zodExtended';
import { createApiResponse } from '@api-docs/openAPIResponseBuilders';
import { validateRequest } from '@middleware/validationHandler';
import { BookedParkingSpotError, handleErrorResponse } from '@src/utils/errors';
import {
  BaseBooking,
  BaseBookingSchema,
  GetBookingSchema,
  GetBookingsSchema,
  NewBooking,
  NewBookingSchema,
  GetReturnBookingSchema,
  UpdateBookingSchema,
} from './bookingModel';
import { bookingService } from './bookingService';
import { MAX_LIMIT_GET_BOOKINGS, QUERY_PARAMS, ROLES } from '@src/utils/constants';
import { PaginationSchema, AuthHeaderSchema, Pagination } from '@modules/common/types';

export const bookingRegistry = new OpenAPIRegistry();
const OPENAPI_PATHS = {
  DELETE: '/bookings/{id}',
  GET_ID: '/bookings/{id}',
  PATCH: '/bookings/{id}',
  POST: '/bookings',
  GET: '/bookings',
};

const registerDeleteRoutes = (router: Router) => {
  bookingRegistry.registerPath({
    method: 'delete',
    path: OPENAPI_PATHS.DELETE,
    tags: ['Bookings'],
    request: {
      headers: AuthHeaderSchema,
      params: GetBookingSchema.shape.params,
    },
    responses: { 204: { description: 'delete successful' } },
  });

  router.delete('/:id', validateRequest(GetBookingSchema), async (req: Request, res: Response) => {
    const { id: user_id, role } = req.user;
    const { id } = req.params;
    // the query wont return the booking if user is not admin and booking doesn't belong to user
    const bookings = await bookingService.find({
      id,
      user_id: role === ROLES.ADMIN ? undefined : user_id,
    });
    if (!bookings.length) {
      return handleErrorResponse(res, `Booking with id ${id} not found`, StatusCodes.NOT_FOUND);
    }
    const deleteSuccessful = await bookingService.delete(id);
    if (!deleteSuccessful) {
      return handleErrorResponse(res, `Failed to delete booking with id ${id}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return res.status(StatusCodes.NO_CONTENT).send();
  });
};

const registerPatchRoutes = (router: Router) => {
  bookingRegistry.registerPath({
    method: 'patch',
    path: OPENAPI_PATHS.PATCH,
    tags: ['Bookings'],
    request: {
      headers: AuthHeaderSchema,
      params: UpdateBookingSchema.shape.params,
      body: {
        content: {
          'application/json': {
            schema: UpdateBookingSchema.shape.body,
          },
        },
      },
    },
    responses: createApiResponse(z.object({ booking: BaseBookingSchema }), 'Success'),
  });

  router.patch('/:id', validateRequest(UpdateBookingSchema), async (req: Request, res: Response) => {
    try {
      const { id: user_id, role } = req.user;
      const { id } = req.params;
      // the query wont return the booking if user is not admin and booking doesn't belong to user
      const bookings = (await bookingService.find({
        id,
        user_id: role === ROLES.ADMIN ? undefined : user_id,
      })) as BaseBooking[];
      if (!bookings.length) {
        return handleErrorResponse(res, `Booking with id ${id} not found`, StatusCodes.NOT_FOUND);
      }
      if (bookings[0].start_date < new Date()) {
        return handleErrorResponse(res, 'Booking cannot be updated after start date', StatusCodes.BAD_REQUEST);
      }
      const updatePayload = {
        start_date: (req.body.start_date && new Date(req.body.start_date)) || bookings[0].start_date,
        end_date: (req.body.end_date && new Date(req.body.end_date)) || bookings[0].end_date,
        park_spot_id: req.body.park_spot_id || bookings[0]?.park_spot_id,
      };
      if (updatePayload.start_date < new Date()) {
        return handleErrorResponse(res, 'Start date must not be in the past', StatusCodes.BAD_REQUEST);
      }
      if (updatePayload.start_date >= updatePayload.end_date) {
        return handleErrorResponse(res, 'Start date must be before end date', StatusCodes.BAD_REQUEST);
      }
      const updatedBooking = await bookingService.update(req.params.id, updatePayload);
      if (!updatedBooking) {
        return handleErrorResponse(res, `Failed to update booking with id ${id}`, StatusCodes.INTERNAL_SERVER_ERROR);
      }
      return res.status(StatusCodes.OK).send({ booking: updatedBooking });
    } catch (err) {
      if (err instanceof BookedParkingSpotError) {
        return handleErrorResponse(res, err.message, StatusCodes.BAD_REQUEST);
      }
      console.error(`Failed to update booking: ${(err as Error).message}`);
      throw err;
    }
  });
};

const registerPostRoutes = (router: Router) => {
  bookingRegistry.registerPath({
    method: 'post',
    path: OPENAPI_PATHS.POST,
    tags: ['Bookings'],
    request: {
      headers: AuthHeaderSchema,
      body: {
        content: {
          'application/json': {
            schema: NewBookingSchema.shape.body,
          },
        },
      },
    },
    responses: createApiResponse(z.object({ booking: BaseBookingSchema }), 'Success', StatusCodes.CREATED),
  });

  router.post('/', validateRequest(NewBookingSchema), async (req: Request, res: Response) => {
    try {
      const newBookingData: NewBooking = {
        ...req.body,
        start_date: new Date(req.body.start_date),
        end_date: new Date(req.body.end_date),
        user_id: req.user.id,
      };
      if (newBookingData.start_date < new Date()) {
        return handleErrorResponse(res, 'Start date must not be in the past', StatusCodes.BAD_REQUEST);
      }
      if (newBookingData.start_date >= newBookingData.end_date) {
        return handleErrorResponse(res, 'Start date must be before end date', StatusCodes.BAD_REQUEST);
      }
      const newBooking = await bookingService.create(newBookingData);
      return res.status(StatusCodes.CREATED).send({ booking: newBooking });
    } catch (err) {
      if (err instanceof BookedParkingSpotError) {
        return handleErrorResponse(res, err.message, StatusCodes.BAD_REQUEST);
      }
      console.error(`Failed to create new booking: ${(err as Error).message}`);
      throw err;
    }
  });
};

const registerGetRoutes = (router: Router) => {
  bookingRegistry.registerPath({
    method: 'get',
    path: OPENAPI_PATHS.GET,
    tags: ['Bookings'],
    request: {
      headers: AuthHeaderSchema,
      query: GetBookingsSchema.shape.query.setKey('expand_parking', z.boolean().optional()),
    },
    responses: createApiResponse(
      z.object({
        items: z.array(GetReturnBookingSchema),
        pagination: PaginationSchema,
      }),
      'Success'
    ),
  });

  router.get('/', validateRequest(GetBookingsSchema), async (req: Request, res: Response) => {
    const { id: user_id, role } = req.user;
    const limit = req.query[QUERY_PARAMS.LIMIT]
      ? parseInt(req.query[QUERY_PARAMS.LIMIT] as string)
      : MAX_LIMIT_GET_BOOKINGS;

    // the query will return all user bookings or all bookings from all users if admin
    const userIdToUse = role === ROLES.ADMIN ? undefined : user_id;
    const bookings = await bookingService.find({
      user_id: userIdToUse,
      expand_parking: req.query[QUERY_PARAMS.EXPAND_PARKING] === 'true',
      last_created_at: req.query[QUERY_PARAMS.LAST_CREATED_AT]
        ? new Date(req.query[QUERY_PARAMS.LAST_CREATED_AT] as string)
        : undefined,
      limit,
    });

    // pagination is done with created_at for best performance as opposed to using OFFSET in SQL: https://hackernoon.com/dont-offset-your-sql-querys-performance
    const newLastCreatedAt = bookings[bookings.length - 1].created_at;
    const { hasNextPage, totalPages, currentPage } = await bookingService.getPaginationCounts({
      user_id: userIdToUse,
      limit,
      last_created_at: newLastCreatedAt,
    });
    const pagination: Pagination = {
      current_page: currentPage,
      total_pages: totalPages,
      max_page_size: limit,
    };
    if (hasNextPage) {
      const url = req.query[QUERY_PARAMS.LAST_CREATED_AT]
        ? querystring
            .unescape(req.originalUrl)
            .replace(req.query[QUERY_PARAMS.LAST_CREATED_AT] as string, newLastCreatedAt.toISOString())
        : `${req.originalUrl}&${QUERY_PARAMS.LAST_CREATED_AT}=${newLastCreatedAt.toISOString()}`;
      pagination.next_page = `${req.protocol}://${req.get('host')}${url}`;
    }

    return res.status(StatusCodes.OK).send({ items: bookings, pagination });
  });

  bookingRegistry.registerPath({
    method: 'get',
    path: OPENAPI_PATHS.GET_ID,
    tags: ['Bookings'],
    request: {
      headers: AuthHeaderSchema,
      params: GetBookingSchema.shape.params,
      query: GetBookingSchema.shape.query
        .setKey('expand_parking', z.boolean().optional())
        .pick({ expand_parking: true }),
    },
    responses: createApiResponse(z.object({ booking: GetReturnBookingSchema }), 'Success'),
  });

  router.get('/:id', validateRequest(GetBookingSchema), async (req: Request, res: Response) => {
    const { id: user_id, role } = req.user;
    const { id } = req.params;
    // the query wont return the booking if user is not admin and booking doesn't belong to user
    const bookings = await bookingService.find({
      id,
      user_id: role === ROLES.ADMIN ? undefined : user_id,
      expand_parking: req.query[QUERY_PARAMS.EXPAND_PARKING] === 'true',
    });
    if (!bookings.length) {
      return handleErrorResponse(res, `Booking with id ${id} not found`, StatusCodes.NOT_FOUND);
    }
    return res.status(StatusCodes.OK).send({ booking: bookings[0] });
  });
};

export const bookingRouter: Router = (() => {
  const router = express.Router();
  registerGetRoutes(router);
  registerPostRoutes(router);
  registerPatchRoutes(router);
  registerDeleteRoutes(router);
  return router;
})();
