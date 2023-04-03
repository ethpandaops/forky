import matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, beforeAll, afterAll } from 'vitest';

import { server } from '@app/mocks/server';

expect.extend(matchers);

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterAll(() => server.close());
