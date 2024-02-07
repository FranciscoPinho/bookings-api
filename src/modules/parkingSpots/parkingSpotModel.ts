import { ColumnType, Generated } from 'kysely';

export interface ParkingSpotsTable {
  id: Generated<number>;
  name: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, string>;
}
