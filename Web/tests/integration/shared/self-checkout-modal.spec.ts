import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SelfCheckoutModal } from '../../../src/app/shared/ui/self-checkout-modal/self-checkout-modal';
import { SelfCheckoutStore } from '../../../src/app/core/state/self-checkout-store';
import { BookModel } from '../../../src/app/core/models/book.model';

function makeBook(overrides: Partial<BookModel> = {}): BookModel {
  return {
    id: 'book-1',
    barcode: '0306406152',
    cover: '',
    title: 'The Pragmatic Programmer',
    authors: ['Andrew Hunt'],
    description: 'desc',
    subjects: ['Software'],
    publicationDate: '2020-01-01',
    publisher: 'Addison-Wesley',
    pages: 352,
    genre: 'Technology',
    ...overrides,
  };
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isoDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function setup(opts: { checkoutResult?: 'success' | 'error' }) {
  const checkoutSpy = jest.fn().mockReturnValue(
    opts.checkoutResult === 'error'
      ? throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Already on loan' } }))
      : of({ message: 'checked out', record: {} }),
  );
  const storeStub = {
    checkout: checkoutSpy,
    extractErrorMessage: jest.fn().mockReturnValue('This book is already on loan.'),
  };

  return { storeStub, checkoutSpy };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [{ provide: SelfCheckoutStore, useValue: stubs.storeStub }];
}

let expectedMinDate: string;
let expectedDueDateIso: string;
let expectedPastDate: string;

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2030-06-15T12:00:00.000Z'));
  expectedMinDate = isoDateString(addDays(new Date(), 1));
  expectedDueDateIso = new Date(`${expectedMinDate}T00:00:00`).toISOString();
  expectedPastDate = isoDateString(addDays(new Date(), -7));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SelfCheckoutModal - initial state', () => {
  it('shows the book title as the subtitle and defaults the due date to tomorrow', async () => {
    const stubs = setup({});
    await render(SelfCheckoutModal, {
      inputs: { book: makeBook() },
      providers: providersFor(stubs),
    });

    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toHaveValue(expectedMinDate);
  });
});

describe('SelfCheckoutModal - validation', () => {
  it('rejects a due date that is today or earlier and does not call checkout', async () => {
    const user = userEvent.setup({ delay: null });
    const stubs = setup({});
    await render(SelfCheckoutModal, {
      inputs: { book: makeBook() },
      providers: providersFor(stubs),
    });

    const dueDate = screen.getByLabelText('Due date');
    await user.clear(dueDate);
    await user.type(dueDate, expectedPastDate);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.getByText('Pick a date after today.')).toBeInTheDocument();
    expect(stubs.checkoutSpy).not.toHaveBeenCalled();
  });

  it('rejects an empty due date', async () => {
    const user = userEvent.setup({ delay: null });
    const stubs = setup({});
    await render(SelfCheckoutModal, {
      inputs: { book: makeBook() },
      providers: providersFor(stubs),
    });

    await user.clear(screen.getByLabelText('Due date'));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.getByText('Pick a date after today.')).toBeInTheDocument();
    expect(stubs.checkoutSpy).not.toHaveBeenCalled();
  });
});

describe('SelfCheckoutModal - submit success', () => {
  it('calls store.checkout with the book id and an ISO due date, then shows the success message', async () => {
    const user = userEvent.setup({ delay: null });
    const stubs = setup({ checkoutResult: 'success' });
    await render(SelfCheckoutModal, {
      inputs: { book: makeBook({ id: 'book-42' }) },
      providers: providersFor(stubs),
    });

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(stubs.checkoutSpy).toHaveBeenCalledWith('book-42', expectedDueDateIso);
    expect(screen.getByText(/Checked out/)).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('closes the modal when Close is clicked after a successful checkout', async () => {
    const user = userEvent.setup({ delay: null });
    const stubs = setup({ checkoutResult: 'success' });
    const { fixture } = await render(SelfCheckoutModal, {
      inputs: { book: makeBook() },
      providers: providersFor(stubs),
    });
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await user.click(screen.getByText('Close'));

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });
});

describe('SelfCheckoutModal - submit error', () => {
  it('shows the store-derived error message and stays on the form', async () => {
    const user = userEvent.setup({ delay: null });
    const stubs = setup({ checkoutResult: 'error' });
    await render(SelfCheckoutModal, {
      inputs: { book: makeBook() },
      providers: providersFor(stubs),
    });

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.getByText('This book is already on loan.')).toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toBeInTheDocument();
  });

  it('re-enables the Confirm button after a failed submit', async () => {
    const user = userEvent.setup({ delay: null });
    const stubs = setup({ checkoutResult: 'error' });
    await render(SelfCheckoutModal, {
      inputs: { book: makeBook() },
      providers: providersFor(stubs),
    });

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });
});

describe('SelfCheckoutModal - cancel', () => {
  it('emits closed when Cancel is clicked without calling checkout', async () => {
    const user = userEvent.setup({ delay: null });
    const stubs = setup({});
    const { fixture } = await render(SelfCheckoutModal, {
      inputs: { book: makeBook() },
      providers: providersFor(stubs),
    });
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(closedSpy).toHaveBeenCalledTimes(1);
    expect(stubs.checkoutSpy).not.toHaveBeenCalled();
  });
});