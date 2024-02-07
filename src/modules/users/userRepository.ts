import { User } from '@modules/users/userModel';
import { getDb } from '@src/db/client';

export const userRepository = {
  findByApiKey: async (apiKey: string): Promise<Partial<User> | null> => {
    const results = await getDb()
      .selectFrom('users')
      .select(['id', 'email', 'api_key', 'role'])
      .where('api_key', '=', apiKey)
      .execute();
    if (!results.length) {
      return null;
    }
    return results[0];
  },
};
