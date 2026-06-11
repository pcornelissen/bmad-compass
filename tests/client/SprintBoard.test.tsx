import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SprintBoard } from '../../src/client/components/SprintBoard.js';
import type { SprintStory, StoryStatus } from '../../src/shared/types.js';

const story = (id: string, status: StoryStatus, epicId = 'epic-1'): SprintStory => ({
  id, title: id, epicId, status, kind: 'story',
});

describe('SprintBoard', () => {
  it('renders nothing when there are no stories', () => {
    const { container } = render(<SprintBoard stories={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only epics and retros exist (no stories)', () => {
    const stories: SprintStory[] = [
      { id: 'epic-1', title: 'Epic 1', epicId: 'epic-1', status: 'done', kind: 'epic' },
      { id: 'epic-1-retrospective', title: 'Retro', epicId: 'epic-1', status: 'done', kind: 'retrospective' },
    ];
    const { container } = render(<SprintBoard stories={stories} />);
    expect(container.firstChild).toBeNull();
  });

  it('places each story in the column matching its status', async () => {
    const stories = [
      story('1-1-a', 'backlog'),
      story('1-2-b', 'in-progress'),
      story('1-3-c', 'done'),
    ];
    render(<SprintBoard stories={stories} />);
    const backlog = screen.getByTestId('column-backlog');
    const inProgress = screen.getByTestId('column-in-progress');
    expect(within(backlog).getByText('1-1-a')).toBeTruthy();
    expect(within(inProgress).getByText('1-2-b')).toBeTruthy();
    // Done is collapsed by default — expand it before asserting its card.
    await userEvent.click(screen.getByTestId('done-toggle'));
    expect(within(screen.getByTestId('column-done')).getByText('1-3-c')).toBeTruthy();
  });

  it('shows a per-column count in the header', () => {
    const stories = [story('1-1-a', 'backlog'), story('1-2-b', 'backlog')];
    render(<SprintBoard stories={stories} />);
    const backlog = screen.getByTestId('column-backlog');
    expect(within(backlog).getByText('2')).toBeTruthy();
  });

  it('renders a Blocked column only when blocked stories exist', () => {
    const { rerender } = render(<SprintBoard stories={[story('1-1-a', 'backlog')]} />);
    expect(screen.queryByTestId('column-blocked')).toBeNull();
    rerender(<SprintBoard stories={[story('1-1-a', 'backlog'), story('1-2-b', 'blocked')]} />);
    const blocked = screen.getByTestId('column-blocked');
    expect(within(blocked).getByText('1-2-b')).toBeTruthy();
  });

  it('sorts cards within a column by epic then story number', () => {
    const stories = [
      story('2-1-late', 'backlog', 'epic-2'),
      story('1-2-mid', 'backlog', 'epic-1'),
      story('1-1-early', 'backlog', 'epic-1'),
    ];
    render(<SprintBoard stories={stories} />);
    const backlog = screen.getByTestId('column-backlog');
    const cards = within(backlog).getAllByTestId('story-card').map(c => c.getAttribute('data-story-id'));
    expect(cards).toEqual(['1-1-early', '1-2-mid', '2-1-late']);
  });

  it('collapses the Done column by default and toggles it via its control', async () => {
    render(<SprintBoard stories={[story('1-1-a', 'done'), story('1-1-b', 'backlog')]} />);
    const done = screen.getByTestId('column-done');
    // Collapsed by default — its card is hidden, but the count still shows.
    expect(within(done).queryByTestId('story-card')).toBeNull();
    expect(within(done).getByText('1')).toBeTruthy();
    expect(screen.getByTestId('done-toggle').getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(screen.getByTestId('done-toggle'));
    expect(within(screen.getByTestId('column-done')).getByTestId('story-card')).toBeTruthy();

    await userEvent.click(screen.getByTestId('done-toggle'));
    expect(within(screen.getByTestId('column-done')).queryByTestId('story-card')).toBeNull();
  });

  it('only the Done column is collapsible — other columns have no toggle and always show cards', () => {
    render(<SprintBoard stories={[story('1-1-a', 'backlog'), story('1-2-b', 'in-progress')]} />);
    // No toggle controls for non-Done columns.
    expect(screen.queryByTestId('backlog-toggle')).toBeNull();
    expect(screen.getByTestId('column-header-backlog').getAttribute('aria-expanded')).toBeNull();
    // Their cards are always visible.
    expect(within(screen.getByTestId('column-backlog')).getByTestId('story-card')).toBeTruthy();
    expect(within(screen.getByTestId('column-in-progress')).getByTestId('story-card')).toBeTruthy();
  });

  it('collapsing Done frees horizontal space (its grid track shrinks)', async () => {
    render(<SprintBoard stories={[story('1-1-a', 'done'), story('1-1-b', 'backlog')]} />);
    const board = screen.getByTestId('sprint-board');
    // Collapsed by default → a narrow fixed track for Done (px), others flexible.
    expect(board.style.gridTemplateColumns).toMatch(/px/);

    await userEvent.click(screen.getByTestId('done-toggle'));
    // Expanded → all columns share equal flexible tracks, no fixed narrow track.
    expect(board.style.gridTemplateColumns).not.toMatch(/px/);
  });

  it('makes the column body scrollable', () => {
    render(<SprintBoard stories={[story('1-1-a', 'backlog')]} />);
    const body = screen.getByTestId('column-body-backlog');
    expect(body.style.overflowY).toBe('auto');
    expect(body.style.maxHeight).not.toBe('');
  });
});
