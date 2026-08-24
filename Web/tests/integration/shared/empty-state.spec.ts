import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../../../src/app/shared/ui/empty-state/empty-state';

describe('EmptyState', () => {
  it('shows the given message', async () => {
    await render(EmptyState, { inputs: { message: 'No books found.' } });

    expect(screen.getByText('No books found.')).toBeInTheDocument();
  });

  it('does not render an action button when no actionLabel is given', async () => {
    await render(EmptyState, { inputs: { message: 'Nothing here.' } });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an action button and emits (action) when clicked', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    await render(EmptyState, {
      inputs: { message: 'No cards yet.', actionLabel: 'Issue a card' },
      on: { action: onAction },
    });

    await user.click(screen.getByRole('button', { name: 'Issue a card' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
