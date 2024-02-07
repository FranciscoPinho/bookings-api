import { PORT } from '@src/utils/env';
import app from '@src/server';
import { shutdownDb } from './db/client';

const server = app.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});

const onCloseSignal = () => {
  server.close(() => {
    shutdownDb().then(process.exit(1));
  });
};

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
