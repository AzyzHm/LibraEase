import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ErrorState } from '../../../src/app/shared/ui/error-state/error-state';

describe('ErrorState', () => {
  it('shows the message in an alert region', async () => {
    await render(ErrorState, { inputs: { message: 'Something went wrong.' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });

  it('emits (retry) when the Retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    await render(ErrorState, { inputs: { message: 'Failed to load.' }, on: { retry: onRetry } });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
