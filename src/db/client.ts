import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { PG_DATABASE, PG_HOST, PG_PASS, PG_PORT, PG_USER } from '@src/utils/env';
import { UsersTable } from '@modules/users/userModel';
import { ParkingSpotsTable } from '@modules/parkingSpots/parkingSpotModel';
import { BookingsTable } from '@modules/bookings/bookingModel';

export interface Database {
  users: UsersTable;
  park_spots: ParkingSpotsTable;
  bookings: BookingsTable;
}

let db: Kysely<Database> | null;

export const getDb = () => {
  if (!db) {
    db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          host: PG_HOST,
          port: PG_PORT,
          user: PG_USER,
          password: PG_PASS,
          database: PG_DATABASE,
        }),
      }),
    });
  }
  return db;
};

export const shutdownDb = async () => {
  if (!db) {
    return;
  }
  await db.destroy();
  db = null;
};
