import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Download from '@components/Download';
import EditableInput from '@components/EditableInput';
import Icon from '@components/Icon';
import { ModeToggle } from '@components/ModeToggle';
import Share from '@components/Share';
import { withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Components/Controls',
  parameters: {
    layout: 'fullscreen',
    tanstack: {
      router: {
        path: '/',
      },
    },
  },
  decorators: [withForkyProviders()],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function EditableInputSet() {
  const [textValue, setTextValue] = useState('ams3-teku-001');
  const [slotValue, setSlotValue] = useState(107);
  const [timeValue, setTimeValue] = useState(new Date('2024-01-01T00:21:24.000Z').getTime());

  return (
    <div className="grid max-w-4xl gap-6 rounded-xl border border-border bg-surface p-6 sm:grid-cols-3">
      <label className="space-y-2 text-sm font-medium text-foreground">
        <span>Text</span>
        <EditableInput value={textValue} onChange={setTextValue} type="text" id="node-input" />
      </label>
      <label className="space-y-2 text-sm font-medium text-foreground">
        <span>Number</span>
        <EditableInput value={slotValue} onChange={setSlotValue} type="number" id="slot-input" />
      </label>
      <label className="space-y-2 text-sm font-medium text-foreground">
        <span>Datetime</span>
        <EditableInput
          value={timeValue}
          onChange={setTimeValue}
          type="datetime-local"
          id="time-input"
        />
      </label>
    </div>
  );
}

export const ActionsAndThemeToggle: Story = {
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="grid gap-8 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Download data='{"story":true}' filename="story.json" size="sm" />
          <Download data='{"story":true}' filename="story.json" size="md" text="Snapshot" />
          <Download data='{"story":true}' filename="story.json" size="lg" text="Full frame" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Icon icon={className => <ArrowDownTrayIcon className={className} />} text="Small" />
          <Icon
            icon={className => <CheckCircleIcon className={className} />}
            text="Medium"
            size="md"
          />
          <Icon
            icon={className => <CheckCircleIcon className={className} />}
            text="Large"
            size="lg"
          />
          <ModeToggle />
        </div>
      </div>
    </div>
  ),
};

export const EditableInputs: Story = {
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <EditableInputSet />
    </div>
  ),
};

export const EditableInputEditing: Story = {
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <EditableInputSet />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue('ams3-teku-001');
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'syd1-lighthouse-001');
    await expect(input).toHaveValue('syd1-lighthouse-001');
  },
};

export const ShareClosed: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Share />
    </div>
  ),
};

export const ShareDialogOpen: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Share />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByTitle('Share link'));
    await waitFor(() => expect(canvas.getByRole('button', { name: /copy/i })).toBeVisible());
  },
};
