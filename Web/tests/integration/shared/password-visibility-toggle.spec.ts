import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { PasswordVisibilityToggle } from '../../../src/app/shared/ui/password-visibility-toggle/password-visibility-toggle';

describe('PasswordVisibilityToggle', () => {
  it('labels the button "Show password" when not visible', async () => {
    await render(PasswordVisibilityToggle, { inputs: { visible: false } });

    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });

  it('labels the button "Hide password" when visible', async () => {
    await render(PasswordVisibilityToggle, { inputs: { visible: true } });

    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('emits (toggled) when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    await render(PasswordVisibilityToggle, { inputs: { visible: false }, on: { toggled: onToggle } });

    await user.click(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});