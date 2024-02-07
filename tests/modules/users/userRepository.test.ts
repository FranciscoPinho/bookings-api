import { userRepository } from '@modules/users/userRepository';
import { ROLES } from '@src/utils/constants';

describe('userService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findByApiKey', () => {
    it('return user', async () => {
      const expectedApiKey = '0khoabkhq95kddrtb7kxrk7hpou7eu';

      const user = await userRepository.findByApiKey(expectedApiKey);

      expect(user?.api_key).toEqual(expectedApiKey);
      expect(user?.role).toEqual(ROLES.ADMIN);
    });

    it('return null', async () => {
      const notFoundKey = 'not_found';

      const user = await userRepository.findByApiKey(notFoundKey);

      expect(user).toBeNull();
    });
  });
});
