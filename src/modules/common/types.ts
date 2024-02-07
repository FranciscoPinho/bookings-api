import { z } from '@src/utils/zodExtended';
import { API_KEY_HEADER } from '@src/utils/constants';

export const AuthHeaderSchema = z.object({ [API_KEY_HEADER]: z.string() });

export const PaginationSchema = z.object({
  next_page: z.string().optional(),
  total_pages: z.number(),
  current_page: z.number(),
  max_page_size: z.number(),
});
export type Pagination = z.infer<typeof PaginationSchema>;
