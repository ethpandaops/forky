import { setupWorker } from 'msw/browser';

import { handlers } from '@app/mocks/handlers';

export const worker = setupWorker(...handlers);
