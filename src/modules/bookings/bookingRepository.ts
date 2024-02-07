import {
  Booking,
  BookingSearchParams,
  BookingUpdate,
  NewBooking,
  GetReturnBooking,
  BaseBooking,
} from '@modules/bookings/bookingModel';
import { Database, getDb } from '@src/db/client';
import { SelectExpression, SelectQueryBuilder, sql } from 'kysely';

export const bookingRepository = {
  findByParams: async (params: BookingSearchParams): Promise<Booking[]> => {
    const selectParams = [
      'bookings.id as id',
      'park_spot_id',
      'start_date',
      'end_date',
      'bookings.created_at',
      'bookings.updated_at',
    ];
    if (params.expand_parking) {
      selectParams.push('park_spots.name as parking_spot');
    }
    let query: SelectQueryBuilder<Database, 'bookings' | 'park_spots', unknown> = getDb()
      .selectFrom('bookings')
      .orderBy('bookings.created_at', 'desc'); // by default we want to see the most recent bookings first
    if (params.expand_parking) {
      query = query.innerJoin('park_spots', 'park_spots.id', 'bookings.park_spot_id');
    }
    query = query.select(selectParams as unknown as SelectExpression<Database, 'bookings'>);
    if (params.id) {
      query = query.where('bookings.id', '=', params.id);
    }
    if (params.user_id) {
      query = query.where('user_id', '=', params.user_id);
    }
    if (params.last_created_at) {
      query = query.where('bookings.created_at', '<', params.last_created_at);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }

    return (await query.execute()) as Booking[];
  },

  insert: async (newBooking: NewBooking): Promise<BaseBooking> => {
    const results = await getDb()
      .insertInto('bookings')
      .values([newBooking])
      .returning(['bookings.id as id', 'park_spot_id', 'start_date', 'end_date', 'created_at', 'updated_at'])
      .execute();
    if (!results.length) {
      throw new Error('Failed to insert new booking');
    }
    return results[0];
  },

  deleteById: async (id: string): Promise<boolean> => {
    const results = await getDb().deleteFrom('bookings').where('id', '=', id).execute();
    return !!results.length && results[0].numDeletedRows > 0;
  },

  updateById: async (id: string, bookingToUpdate: BookingUpdate): Promise<BaseBooking | null> => {
    const update = await getDb()
      .updateTable('bookings')
      .set(bookingToUpdate)
      .where('id', '=', id)
      .returning(['bookings.id as id', 'park_spot_id', 'start_date', 'end_date', 'created_at', 'updated_at'])
      .execute();
    if (!update.length) {
      return null;
    }
    return update[0];
  },

  findOverlappingBookings: async (parkSpotId: number, startDate: Date, endDate: Date): Promise<Partial<Booking>[]> => {
    // the raw SQL looks much more readable than the query builder alternative in this case
    const results = await sql<Partial<Booking>>`
    SELECT park_spot_id, start_date, end_date 
    FROM bookings b
    WHERE b.park_spot_id = ${parkSpotId} AND
        NOT (
        b.start_date >= ${endDate} OR b.end_date <= ${startDate}
    )`.execute(getDb());

    return results.rows;
  },

  count: async (params: Pick<BookingSearchParams, 'last_created_at' | 'user_id'>): Promise<number> => {
    let query = getDb()
      .selectFrom('bookings')
      .select(({ fn }) => [fn.countAll().as('count')]);

    if (params.user_id) {
      query = query.where('user_id', '=', params.user_id);
    }
    if (params.last_created_at) {
      query = query.where('created_at', '<', params.last_created_at);
    }

    const results = await query.execute();
    if (!results.length) {
      return 0;
    }

    return Number(results[0].count);
  },
};
