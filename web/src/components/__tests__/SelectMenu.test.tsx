import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import SelectMenu from '@stories/components/SelectMenu/SelectMenu.stories';

test('SelectMenu changes the text after click', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - storybook partials component types
  if (SelectMenu.component) render(<SelectMenu.component {...SelectMenu.args} />);

  const data = SelectMenu?.args?.data?.[5];
  if (!data) throw new Error('data is undefined');

  const menu = screen.getByTestId('menu') as HTMLButtonElement;
  expect(menu).toBeInTheDocument();

  let selectedItem = screen.getByTestId('selected-item-name');
  expect(selectedItem).toHaveTextContent(
    SelectMenu?.args?.data?.[SelectMenu?.args?.initialSelectedIndex || 0]?.name ?? '',
  );

  fireEvent.click(menu);
  const item = screen.getByTestId(data.id);
  expect(item).toBeInTheDocument();
  fireEvent.click(item);

  selectedItem = screen.getByTestId('selected-item-name');
  expect(selectedItem).toHaveTextContent(data.name);
});
