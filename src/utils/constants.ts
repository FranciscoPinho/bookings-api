export enum ROLES {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export enum QUERY_PARAMS {
  LAST_CREATED_AT = 'last_created_at',
  LIMIT = 'limit',
  EXPAND_PARKING = 'expand_parking',
}
export const API_KEY_HEADER = 'x-api-key';
export const MAX_LIMIT_GET_BOOKINGS = 100;

// these would normally not exist - only for this demo exercise
export const TEST_ADMIN_API_KEY = '0khoabkhq95kddrtb7kxrk7hpou7eu';
export const TEST_USER_API_KEY = '0u2h4cqwn3k6zgswkn0a9byrb5fkr4';
