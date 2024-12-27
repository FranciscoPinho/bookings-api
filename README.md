 A Node.js service that enables users, based on their permission level
(admin or standard), to perform CRUD operations for parking spot bookings.
- Admin users can create bookings and can get/edit/delete any existing booking.
- Standard users can create new bookings and can get/edit/delete only the bookings they have created themselves
For simplicity, user authentication will be done solely through an API token (no login, sessions, etc.).
Steps to run:

- npm run docker:build && npm run docker:start

Access http://localhost:3000/docs to check API documentation and run the various endpoints. Just click "try it out"
Admin API key = '0khoabkhq95kddrtb7kxrk7hpou7eu'
User API key = '0u2h4cqwn3k6zgswkn0a9byrb5fkr4'

Steps to run tests:

- npm run docker:build:test && npm run docker:start:test

THINGS I DID NOT IMPLEMENT BUT COULD HAVE

- A limit to how long a booking can be, I didnt set any limits
