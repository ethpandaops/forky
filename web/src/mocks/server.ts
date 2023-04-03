import { setupServer } from 'msw/node';

import { handlers } from '@app/mocks/handlers';

export const server = setupServer(...handlers);
