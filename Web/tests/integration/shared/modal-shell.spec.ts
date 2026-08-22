import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Component } from '@angular/core';
import { ModalShell } from '../../../src/app/shared/ui/modal-shell/modal-shell';

@Component({
  selector: 'app-modal-shell-test-host',
  standalone: true,
  imports: [ModalShell],
  template: `<app-modal-shell [title]="'Confirm delete'" (closed)="onClosed()">
    <p>Are you sure?</p>
  </app-modal-shell>`,
})
class ModalShellTestHost {
  readonly onClosed = jest.fn();
}

describe('ModalShell', () => {
  it('renders the title and projected content', async () => {
    await render(ModalShellTestHost);

    expect(screen.getByRole('heading', { name: 'Confirm delete' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('emits closed when the close button is clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(ModalShellTestHost);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(fixture.componentInstance.onClosed).toHaveBeenCalledTimes(1);
  });

  it('emits closed when the backdrop is clicked, but not when the panel itself is clicked', async () => {
    const user = userEvent.setup();
    const { container, fixture } = await render(ModalShellTestHost);

    await user.click(screen.getByText('Are you sure?'));
    expect(fixture.componentInstance.onClosed).not.toHaveBeenCalled();

    const backdrop = container.querySelector('.surface-scrim') as HTMLElement;
    await user.click(backdrop);
    expect(fixture.componentInstance.onClosed).toHaveBeenCalledTimes(1);
  });
});