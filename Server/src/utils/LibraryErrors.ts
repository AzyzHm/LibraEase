export class UnableToSaveUserError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UnableToFetchUserError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class AccountPendingApprovalError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UserDoesNotExistError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BookDoesNotExistError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class LibraryCardDoesNotExistError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class LoanRecordDoesNotExistError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidRoleTransitionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BookAlreadyLoanedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BookHasLoanHistoryError extends Error {
  constructor(message: string) {
    super(message);
  }
}
