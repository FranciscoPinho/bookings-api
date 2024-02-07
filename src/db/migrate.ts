import * as path from 'path';
import { promises as fs } from 'fs';
import { Migrator, FileMigrationProvider } from 'kysely';
import { Client } from 'pg';
import { getDb, shutdownDb } from './client';
import { PG_DATABASE, PG_HOST, PG_PASS, PG_PORT, PG_USER } from '@src/utils/env';

async function createDbIfNotExists() {
  const client = new Client({
    host: PG_HOST,
    user: PG_USER,
    password: PG_PASS,
    port: PG_PORT,
  });

  await client.connect();

  const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${PG_DATABASE}'`);

  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE "${PG_DATABASE}";`);
  }

  await client.end();
}

async function migrateToLatest() {
  await createDbIfNotExists();
  const db = getDb();

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await shutdownDb();
}

migrateToLatest();
