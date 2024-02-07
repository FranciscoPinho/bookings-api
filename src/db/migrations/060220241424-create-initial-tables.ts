/* eslint-disable @typescript-eslint/no-explicit-any */
import { ROLES, TEST_ADMIN_API_KEY, TEST_USER_API_KEY } from '@src/utils/constants';
import { Kysely, sql } from 'kysely';

// Kysely<any> type is required for migrations, see: https://kysely.dev/docs/migrations
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('last_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('email', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('role', 'varchar(10)', (col) => col.notNull())
    .addColumn('api_key', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db
    .insertInto('users')
    .values([
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        role: ROLES.ADMIN,
        api_key: TEST_ADMIN_API_KEY,
      },
      {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
        role: ROLES.USER,
        api_key: TEST_USER_API_KEY,
      },
    ])
    .execute();

  await db.schema
    .createTable('park_spots')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db
    .insertInto('park_spots')
    .values(
      Array.from({ length: 10 }, (_, index) => ({
        name: `spot${index}`,
      }))
    )
    .execute();

  await db.schema
    .createTable('bookings')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'int4', (col) => col.references('users.id'))
    .addColumn('park_spot_id', 'int4', (col) => col.references('park_spots.id'))
    .addColumn('start_date', 'timestamp', (col) => col.notNull())
    .addColumn('end_date', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema.createIndex('bookings_user_id_idx').on('bookings').column('user_id').execute(); // get user bookings index
  await db.schema.createIndex('bookings_created_at_idx').on('bookings').column('created_at').execute(); // pagination index
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('bookings_user_id_idx').execute();
  await db.schema.dropIndex('bookings_created_at_idx').execute();
  await db.schema.dropTable('bookings').execute();
  await db.schema.dropTable('users').execute();
  await db.schema.dropTable('park_spots').execute();
}
