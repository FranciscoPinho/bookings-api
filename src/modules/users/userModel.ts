import { ROLES } from '@src/utils/constants';
import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface UsersTable {
  id: Generated<number>;
  first_name: string;
  last_name: string;
  api_key: string;
  email: string;
  role: ROLES;
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, string>;
}
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;
