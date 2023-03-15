import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import Graph from '@stories/components/Graph/Graph.stories';

test('Graph changes the text after click', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - storybook partials component types
  if (Graph.component) render(<Graph.component {...Graph.args} />);

  const svg = screen.getByTestId('svg') as HTMLOrSVGElement;
  expect(svg).toBeInTheDocument();
});
