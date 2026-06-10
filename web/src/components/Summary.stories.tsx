import type { Meta, StoryObj } from '@storybook/tanstack-react';

import {
  SummaryCard,
  SummaryLink,
  SummaryRow,
  SummarySection,
  ValidityBadge,
} from '@components/Summary';
import { PanelSurface, withForkyProviders } from '@app/stories/storybook';
import { storyBlockRoots } from '@app/stories/fixtures';

const meta = {
  title: 'Components/Summary',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withForkyProviders()],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const CardWithRowsSectionsAndLinks: Story = {
  render: () => (
    <PanelSurface>
      <SummaryCard>
        <SummaryRow label="ID" mono>
          <SummaryLink href="/snapshot/frame-alpha">frame-alpha</SummaryLink>
        </SummaryRow>
        <SummaryRow label="Taken at">2024-01-01T00:21:25.000Z</SummaryRow>
        <SummaryRow label="Source">
          <SummaryLink href="/node/ams3-teku-001">ams3-teku-001</SummaryLink>
        </SummaryRow>
        <SummaryRow label="Block root" mono>
          {storyBlockRoots.slot107}
        </SummaryRow>
        <SummarySection title="Labels" />
        <SummaryRow label="region">ams3</SummaryRow>
        <SummaryRow label="consensus client version">v24.12.0</SummaryRow>
      </SummaryCard>
    </PanelSurface>
  ),
};

export const ValidityBadges: Story = {
  render: () => (
    <PanelSurface className="items-center">
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-6">
        <ValidityBadge validity="valid" />
        <ValidityBadge validity="optimistic" />
        <ValidityBadge validity="invalid" />
        <ValidityBadge validity="unknown" />
      </div>
    </PanelSurface>
  ),
};
