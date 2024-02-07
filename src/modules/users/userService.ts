import { User } from '@modules/users/userModel';
import { userRepository } from '@modules/users/userRepository';

export const userService = {
  findByApiKey: async (apiKey: string): Promise<Partial<User> | null> => {
    return userRepository.findByApiKey(apiKey);
  },
};
