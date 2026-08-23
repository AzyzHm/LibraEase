import { render, screen } from '@testing-library/angular';
import { LoadingState } from '../../../src/app/shared/ui/loading-state/loading-state';

describe('LoadingState', () => {
  it('shows a default "Loading…" message with an accessible status role', async () => {
    await render(LoadingState);

    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('shows a custom message when provided', async () => {
    await render(LoadingState, { inputs: { message: 'Fetching your books…' } });

    expect(screen.getByRole('status')).toHaveTextContent('Fetching your books…');
  });

  it('uses reduced vertical padding when compact is true', async () => {
    const { container } = await render(LoadingState, { inputs: { compact: true } });

    const root = container.querySelector('[role="status"]');
    expect(root).toHaveClass('py-8');
    expect(root).not.toHaveClass('py-16');
  });
});
