import { setupWorker } from 'msw';

import { handlers } from '@app/mocks/handlers';

export const worker = setupWorker(...handlers);
