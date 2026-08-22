import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { BookCard } from '../../../src/app/shared/ui/book-card/book-card';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { SelfCheckoutStore } from '../../../src/app/core/state/self-checkout-store';
import { BookModel } from '../../../src/app/core/models/book.model';

function makeBook(overrides: Partial<BookModel> = {}): BookModel {
  return {
    id: 'book-1',
    barcode: '0306406152',
    cover: '',
    title: 'The Pragmatic Programmer',
    authors: ['Andrew Hunt', 'David Thomas'],
    description: 'desc',
    subjects: ['Software'],
    publicationDate: '2020-01-01',
    publisher: 'Addison-Wesley',
    pages: 352,
    genre: 'Technology',
    ...overrides,
  };
}

function setup(opts: { isPatron: boolean; availability?: Record<string, boolean> }) {
  const checkAvailabilitySpy = jest.fn();
  const authStoreStub = { isPatron: () => opts.isPatron };
  const checkoutStoreStub = {
    availability: () => opts.availability ?? {},
    checkAvailability: checkAvailabilitySpy,
    checkout: () => of({ message: 'checked out', record: {} }),
    extractErrorMessage: () => 'error',
  };

  return { authStoreStub, checkoutStoreStub, checkAvailabilitySpy };
}

describe('BookCard - rendering', () => {
  it('shows title, authors, publisher, and genre', async () => {
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: false });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    expect(screen.getByRole('heading', { name: 'The Pragmatic Programmer' })).toBeInTheDocument();
    expect(screen.getByText('Andrew Hunt, David Thomas')).toBeInTheDocument();
    expect(screen.getByText('Addison-Wesley')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('falls back to "Unknown author" when the authors list is empty', async () => {
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: false });
    await render(BookCard, {
      inputs: { book: makeBook({ authors: [] }) },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    expect(screen.getByText('Unknown author')).toBeInTheDocument();
  });

  it('shows a text placeholder (not an <img>) when there is no cover URL', async () => {
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: false });
    const { container } = await render(BookCard, {
      inputs: { book: makeBook({ cover: '' }) },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    expect(container.querySelector('img')).toBeNull();
  });

  it('swaps to the text placeholder after the cover <img> fails to load', async () => {
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: false });
    const { container } = await render(BookCard, {
      inputs: { book: makeBook({ cover: 'https://example.com/broken.jpg' }) },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();

    fireEvent.error(img);

    expect(container.querySelector('img')).toBeNull();
  });
});

describe('BookCard - patron checkout affordance', () => {
  it('fires an availability check on init for a patron', async () => {
    const { authStoreStub, checkoutStoreStub, checkAvailabilitySpy } = setup({ isPatron: true });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    expect(checkAvailabilitySpy).toHaveBeenCalledWith('book-1');
  });

  it('does not fire an availability check for a non-patron', async () => {
    const { authStoreStub, checkoutStoreStub, checkAvailabilitySpy } = setup({ isPatron: false });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    expect(checkAvailabilitySpy).not.toHaveBeenCalled();
  });

  it('shows a disabled "Checking availability…" button while availability is unknown', async () => {
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: true, availability: {} });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    expect(screen.getByRole('button', { name: 'Checking availability…' })).toBeDisabled();
  });

  it('shows a disabled "Currently loaned" button when unavailable', async () => {
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: true, availability: { 'book-1': false } });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    expect(screen.getByRole('button', { name: 'Currently loaned' })).toBeDisabled();
  });

  it('shows an enabled "Borrow this book" button when available, and no checkout button for staff', async () => {
    const patron = setup({ isPatron: true, availability: { 'book-1': true } });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: patron.authStoreStub },
        { provide: SelfCheckoutStore, useValue: patron.checkoutStoreStub },
      ],
    });
    expect(screen.getByRole('button', { name: 'Borrow this book' })).toBeEnabled();
  });

  it('shows no checkout button at all for a staff member', async () => {
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: false });
    const { container } = await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('opens the checkout modal (not the detail modal) when "Borrow this book" is clicked', async () => {
    const user = userEvent.setup();
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: true, availability: { 'book-1': true } });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Borrow this book' }));

    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });
});

describe('BookCard - detail modal', () => {
  it('opens the detail modal when the card body is clicked', async () => {
    const user = userEvent.setup();
    const { authStoreStub, checkoutStoreStub } = setup({ isPatron: false });
    await render(BookCard, {
      inputs: { book: makeBook() },
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: SelfCheckoutStore, useValue: checkoutStoreStub },
      ],
    });

    await user.click(screen.getByRole('button', { name: /the pragmatic programmer/i }));

    expect(screen.getByText('desc')).toBeInTheDocument();
    expect(screen.getByText('Publisher')).toBeInTheDocument();
  });
});