import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';
import { z } from '@src/utils/zodExtended';
import { MAX_LIMIT_GET_BOOKINGS } from '@src/utils/constants';

export interface BookingsTable {
  id: ColumnType<string, never, never>;
  user_id: ColumnType<number, number, never>;
  park_spot_id: ColumnType<number, number, number>;
  start_date: ColumnType<Date, Date, Date>;
  end_date: ColumnType<Date, Date, Date>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date, never, Date>;
}
export type Booking = Selectable<BookingsTable> & { parking_spot?: string };
export type NewBooking = Insertable<BookingsTable>;
export type BookingUpdate = Updateable<BookingsTable>;

const stringDateTime = z
  .string()
  .datetime()
  .openapi({ description: 'ISO DateTime String', example: '2024-02-08T21:51:03.435Z' });

export const BaseBookingSchema = z.object({
  id: z.string().length(36), // .uuid() validation is currently bugged - https://github.com/colinhacks/zod/issues/91
  park_spot_id: z.number().positive(),
  start_date: z.date(),
  end_date: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type BaseBooking = z.infer<typeof BaseBookingSchema>;
export type GetReturnBooking = z.infer<typeof GetReturnBookingSchema>;
export const GetReturnBookingSchema = BaseBookingSchema.or(
  z.object({
    id: z.string().length(36),
    parking_spot: z.object({
      id: z.number().positive(),
      name: z.string(),
    }),
    start_date: z.date(),
    end_date: z.date(),
    created_at: z.date(),
    updated_at: z.date(),
  })
);

export const NewBookingSchema = z.object({
  body: z.object({
    park_spot_id: z.number(),
    start_date: stringDateTime,
    end_date: stringDateTime,
  }),
});
const expandParkingSchema = z.literal('true').or(z.literal('false')).optional();
export const GetBookingSchema = z.object({
  params: z.object({
    id: z.string().length(36),
  }),
  query: z.object({
    expand_parking: expandParkingSchema,
    last_created_at: stringDateTime.optional(),
  }),
});
export const UpdateBookingSchema = z.object({
  body: z
    .object({
      park_spot_id: z.number().optional(),
      start_date: stringDateTime.optional(),
      end_date: stringDateTime.optional(),
    })
    .refine(
      (obj) => {
        for (const val of Object.values(obj)) {
          if (val !== undefined) return true;
        }
        return false;
      },
      {
        message: 'Update request body must have at least one property defined',
      }
    ),
  params: GetBookingSchema.shape.params,
});
export const GetBookingsSchema = z.object({
  query: z.object({
    expand_parking: expandParkingSchema,
    last_created_at: stringDateTime.optional(),
    limit: z.coerce.number().positive().max(MAX_LIMIT_GET_BOOKINGS).optional(),
  }),
});
export type BookingSearchParams = {
  id?: string;
  user_id?: number;
  expand_parking?: boolean;
  last_created_at?: Date;
  limit?: number;
};
