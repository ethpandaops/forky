import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import Checkbox from '@stories/components/Checkbox/Checkbox.stories';

test('Checkbox changes the text after click', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - storybook partials component types
  if (Checkbox.component) render(<Checkbox.component {...Checkbox.args} />);

  const checkbox = screen.getByLabelText('this is a checkbox') as HTMLInputElement;
  expect(checkbox).toBeInTheDocument();
  fireEvent.click(checkbox);
  expect(checkbox.checked).toBeTruthy();
});
