import { User } from '@modules/users/userModel';
import { userRepository } from '@modules/users/userRepository';
import { userService } from '@modules/users/userService';
import { ROLES } from '@src/utils/constants';

jest.mock('@modules/users/userRepository');

describe('userService', () => {
  const mockUsers: Partial<User> = {
    email: 'alice@example.com',
    role: ROLES.ADMIN,
    api_key: 'key',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findByApiKey', () => {
    it('returns user', async () => {
      const expectedApiKey = 'key';
      (userRepository.findByApiKey as jest.Mock).mockReturnValue(mockUsers);

      const user = await userService.findByApiKey(expectedApiKey);

      expect(user?.api_key).toEqual(expectedApiKey);
    });
  });
});
