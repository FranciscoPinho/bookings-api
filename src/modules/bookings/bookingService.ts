import { bookingRepository } from './bookingRepository';
import { Booking, BookingSearchParams, BookingUpdate, NewBooking, GetReturnBooking, BaseBooking } from './bookingModel';
import { BookedParkingSpotError } from '@src/utils/errors';
import { MAX_LIMIT_GET_BOOKINGS } from '@src/utils/constants';

const checkOverlappingBookings = async (newBooking: NewBooking): Promise<string | undefined> => {
  const overlappingBookings = await bookingRepository.findOverlappingBookings(
    newBooking.park_spot_id,
    newBooking.start_date,
    newBooking.end_date
  );
  if (overlappingBookings.length) {
    return `Parking spot is already booked from ${overlappingBookings[0].start_date?.toLocaleString()} to ${overlappingBookings[0].end_date?.toLocaleString()}`;
  }
};

export const bookingService = {
  create: async (newBooking: NewBooking): Promise<BaseBooking> => {
    const overlappedBooking = await checkOverlappingBookings(newBooking);
    if (overlappedBooking) {
      throw new BookedParkingSpotError(overlappedBooking);
    }
    return bookingRepository.insert(newBooking);
  },

  find: async (params: BookingSearchParams): Promise<GetReturnBooking[]> => {
    const bookings = await bookingRepository.findByParams(params);
    if (bookings.length && params.expand_parking) {
      return bookings.map((booking) => ({
        id: booking.id,
        parking_spot: {
          id: booking.park_spot_id,
          name: booking.parking_spot as string,
        },
        start_date: booking.start_date,
        end_date: booking.end_date,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      }));
    }
    return bookings as GetReturnBooking[];
  },

  update: async (id: string, bookingToUpdate: BookingUpdate): Promise<BaseBooking | null> => {
    const overlappedBooking = await checkOverlappingBookings(bookingToUpdate as NewBooking);
    if (overlappedBooking) {
      throw new BookedParkingSpotError(overlappedBooking);
    }
    return bookingRepository.updateById(id, { ...bookingToUpdate, updated_at: new Date() });
  },

  delete: async (id: string): Promise<boolean> => {
    return bookingRepository.deleteById(id);
  },

  getPaginationCounts: async (
    params: Pick<BookingSearchParams, 'last_created_at' | 'limit' | 'user_id'>
  ): Promise<{ hasNextPage: boolean; totalPages: number; currentPage: number }> => {
    const limit = params.limit || MAX_LIMIT_GET_BOOKINGS;
    const countLeft = await bookingRepository.count(params);
    const pagesLeft = Math.ceil(countLeft / limit);
    const totalPages = Math.ceil((await bookingRepository.count({ user_id: params.user_id })) / limit);
    const currentPage = totalPages - pagesLeft;

    return {
      hasNextPage: countLeft > 0,
      currentPage,
      totalPages,
    };
  },
};
