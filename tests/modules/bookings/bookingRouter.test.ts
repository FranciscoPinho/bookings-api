import request from 'supertest';

import app from '@src/server';
import { StatusCodes } from 'http-status-codes';
import { BaseBooking, GetReturnBookingSchema } from '@modules/bookings/bookingModel';
import { API_KEY_HEADER, MAX_LIMIT_GET_BOOKINGS, TEST_ADMIN_API_KEY, TEST_USER_API_KEY } from '@src/utils/constants';
import { getDb, shutdownDb } from '@src/db/client';
import { Pagination } from '@modules/common/types';

const newBookingBody = ({
  park_spot_id,
  year,
  hourStart,
  hourEnd,
}: {
  park_spot_id: number;
  year: number;
  hourStart: number;
  hourEnd: number;
}) => ({
  park_spot_id,
  start_date: `${year}-02-08T${hourStart}:51:03.435Z`,
  end_date: `${year}-02-08T${hourEnd}:51:03.435Z`,
});

describe('Bookings API endpoints', () => {
  const bookingsEndpoint = '/bookings';
  let adminCreatedBooking: BaseBooking, userCreatedBooking: BaseBooking;

  beforeAll(async () => {
    await getDb().deleteFrom('bookings').execute();
  });
  afterAll(async () => {
    await shutdownDb();
  });

  describe('POST', () => {
    it('POST / - created by admin', async () => {
      const body = newBookingBody({
        park_spot_id: 1,
        year: 2500,
        hourStart: 15,
        hourEnd: 16,
      });
      const response = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY })
        .send(body);

      const result: BaseBooking = response.body.booking;
      adminCreatedBooking = result;

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(result.park_spot_id).toEqual(1);
      expect(result.start_date).toEqual(body.start_date);
      expect(result.end_date).toEqual(body.end_date);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('POST / - created by user', async () => {
      const body = newBookingBody({
        park_spot_id: 1,
        year: 2500,
        hourStart: 12,
        hourEnd: 14,
      });
      const response = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send(body);

      const result: BaseBooking = response.body.booking;
      userCreatedBooking = result;

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(result.park_spot_id).toEqual(1);
      expect(result.start_date).toEqual(body.start_date);
      expect(result.end_date).toEqual(body.end_date);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('POST / - overlapped booking failure', async () => {
      const body = newBookingBody({
        park_spot_id: 1,
        year: 2500,
        hourStart: 13,
        hourEnd: 15,
      });
      const response = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send(body);

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(response.body.error.message.includes('Parking spot is already booked from')).toBe(true);
    });

    it('POST / - start date > end date', async () => {
      const body = newBookingBody({
        park_spot_id: 1,
        year: 2500,
        hourStart: 20,
        hourEnd: 15,
      });
      const response = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send(body);

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    it('POST / - start date in the past', async () => {
      const body = newBookingBody({
        park_spot_id: 1,
        year: 1900,
        hourStart: 10,
        hourEnd: 15,
      });
      const response = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send(body);

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    it('POST / - invalid body request', async () => {
      const response = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send({});

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    it('POST / - invalid api key', async () => {
      const body = newBookingBody({
        park_spot_id: 2,
        year: 2500,
        hourStart: 13,
        hourEnd: 15,
      });
      const response = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: 'nonexistentkey' })
        .send(body);

      expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });

  describe('GET', () => {
    it('GET / - by admin', async () => {
      const response = await request(app)
        .get(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY });

      const result: BaseBooking[] = response.body.items;
      const pagination: Pagination = response.body.pagination;

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(result.length).toEqual(2);
      // returns most recent bookings first
      expect(result[0].id).toEqual(userCreatedBooking.id);
      expect(result[1].id).toEqual(adminCreatedBooking.id);
      expect(pagination).toEqual({
        total_pages: 1,
        current_page: 1,
        max_page_size: MAX_LIMIT_GET_BOOKINGS,
      });
    });

    it('GET / - by user', async () => {
      const response = await request(app)
        .get(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY });

      const result: BaseBooking[] = response.body.items;
      const pagination: Pagination = response.body.pagination;

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(result.length).toEqual(1);
      expect(result[0].id).toEqual(userCreatedBooking.id);
      expect(pagination).toEqual({
        total_pages: 1,
        current_page: 1,
        max_page_size: MAX_LIMIT_GET_BOOKINGS,
      });
    });

    it('GET / - pagination and query params', async () => {
      const response = await request(app)
        .get(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY })
        .query({ limit: 1, expand_parking: true });

      const result = response.body.items;
      const pagination: Pagination = response.body.pagination;

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(result.length).toEqual(1);
      expect(result[0].id).toEqual(userCreatedBooking.id);
      expect(result[0].parking_spot).toEqual({
        id: userCreatedBooking.park_spot_id,
        name: 'spot0',
      });
      expect(pagination.total_pages).toEqual(2);
      expect(pagination.current_page).toEqual(1);
      expect(
        pagination.next_page?.includes(
          `/bookings?limit=1&expand_parking=true&last_created_at=${userCreatedBooking.created_at}`
        )
      ).toBe(true);

      //
      const response2 = await request(app)
        .get(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY })
        .query({ limit: 1, expand_parking: false, last_created_at: userCreatedBooking.created_at });

      const result2 = response2.body.items;
      const pagination2: Pagination = response2.body.pagination;

      expect(response2.statusCode).toEqual(StatusCodes.OK);
      expect(result2.length).toEqual(1);
      expect(result2[0].id).toEqual(adminCreatedBooking.id);
      expect(result2[0].parking_spot).toBeUndefined();
      expect(pagination2).toEqual({
        total_pages: 2,
        current_page: 2,
        max_page_size: 1,
      });
    });

    it('GET / - invalid api key', async () => {
      const response = await request(app)
        .get(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: 'invalid_api_key' });

      expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });

    it('GET /id - admin can get booking from other users', async () => {
      const response = await request(app)
        .get(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(response.body.booking).toEqual(userCreatedBooking);
    });

    it('GET /id - with expand_parking query', async () => {
      const response = await request(app)
        .get(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY })
        .query({ expand_parking: true });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(response.body.booking.parking_spot).toEqual({ id: userCreatedBooking.park_spot_id, name: 'spot0' });
    });

    it('GET /id - user can get own booking', async () => {
      const response = await request(app)
        .get(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(response.body.booking).toEqual(userCreatedBooking);
    });

    it('GET /id - not found if user has no ownership of booking', async () => {
      const response = await request(app)
        .get(`${bookingsEndpoint}/${adminCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .query({ expand_parking: true });

      expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    it('GET /id - invalid booking id', async () => {
      const response = await request(app)
        .get(`${bookingsEndpoint}/${userCreatedBooking.id.substring(0, 20)}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY });

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    it('GET /id - invalid api key', async () => {
      const response = await request(app)
        .get(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: 'invalidkey' });

      expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });

  describe('PATCH', () => {
    it('PATCH /id - admin updates any booking', async () => {
      const response = await request(app)
        .patch(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY })
        .send({ park_spot_id: 3 });

      const result: BaseBooking = response.body.booking;

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(result.park_spot_id).toEqual(3);
      expect(result.updated_at).not.toEqual(userCreatedBooking.updated_at);
      userCreatedBooking = result;
    });

    it('PATCH /id - user updates own booking', async () => {
      const response = await request(app)
        .patch(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send({ park_spot_id: 2 });

      const result: BaseBooking = response.body.booking;

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(result.park_spot_id).toEqual(2);
      expect(result.updated_at).not.toEqual(userCreatedBooking.updated_at);
      userCreatedBooking = result;
    });

    it('PATCH /id - user cant access other user bookings', async () => {
      const response = await request(app)
        .patch(`${bookingsEndpoint}/${adminCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send({ park_spot_id: 2 });

      expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    it('PATCH /id - fails if overlapping bookings', async () => {
      const response = await request(app)
        .patch(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send({
          park_spot_id: adminCreatedBooking.park_spot_id,
          start_date: adminCreatedBooking.start_date,
          end_date: adminCreatedBooking.end_date,
        });

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(response.body.error.message.includes('Parking spot is already booked from')).toBe(true);
    });

    it('PATCH /id - fails if start_date > end_date', async () => {
      const response = await request(app)
        .patch(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send({ start_date: userCreatedBooking.end_date });

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    it('PATCH /id - fails if start_date in the past', async () => {
      const response = await request(app)
        .patch(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send({ start_date: '1995-02-08T20:51:03.435Z' });

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });

  describe('DELETE', () => {
    it('DELETE /id - user deletes own booking', async () => {
      const body = newBookingBody({
        park_spot_id: 5,
        year: 2600,
        hourStart: 15,
        hourEnd: 16,
      });
      const responseCreate = await request(app)
        .post(bookingsEndpoint)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY })
        .send(body);
      const newBookingId = responseCreate.body.booking.id;
      const response = await request(app)
        .delete(`${bookingsEndpoint}/${newBookingId}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY });

      expect(response.statusCode).toEqual(StatusCodes.NO_CONTENT);
    });

    it('DELETE /id - user cannot delete other user bookings', async () => {
      const response = await request(app)
        .delete(`${bookingsEndpoint}/${adminCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_USER_API_KEY });

      expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    it('DELETE /id - admin deletes any booking', async () => {
      const response = await request(app)
        .delete(`${bookingsEndpoint}/${userCreatedBooking.id}`)
        .set({ [API_KEY_HEADER]: TEST_ADMIN_API_KEY });

      expect(response.statusCode).toEqual(StatusCodes.NO_CONTENT);
    });

    it('DELETE /id - no api key', async () => {
      const response = await request(app).delete(`${bookingsEndpoint}/${userCreatedBooking.id}`);

      expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });
});
