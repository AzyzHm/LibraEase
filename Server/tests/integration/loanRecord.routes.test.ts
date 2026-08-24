import request from 'supertest';
import { createApp } from '../../src/app';
import * as LoanRecordDao from '../../src/daos/LoanRecordDao';
import { ILoanRecordModel, ILoanRecordWithItem } from '../../src/daos/LoanRecordDao';
import { IBookModel } from '../../src/daos/BookDao';
import { authHeaderFor } from './helpers/authToken';

jest.mock('../../src/daos/LoanRecordDao');

const mockedLoanRecordDao = LoanRecordDao as jest.Mocked<typeof LoanRecordDao>;
const app = createApp();

const RECORD_UUID = '11111111-1111-4111-8111-111111111111';
const PATRON_UUID = '22222222-2222-4222-8222-222222222222';
const EMPLOYEE_UUID = '33333333-3333-4333-8333-333333333333';
const ITEM_UUID = '44444444-4444-4444-8444-444444444444';

function makeRecord(overrides: Partial<ILoanRecordModel> = {}): ILoanRecordModel {
  return {
    id: RECORD_UUID,
    status: 'LOANED',
    loanedDate: new Date('2026-01-01'),
    dueDate: new Date('2026-01-15'),
    returnedDate: null,
    patron: PATRON_UUID,
    employeeOut: EMPLOYEE_UUID,
    employeeIn: null,
    item: ITEM_UUID,
    ...overrides,
  };
}

function makeRecordWithItem(
  overrides: Partial<ILoanRecordModel> = {},
): ILoanRecordWithItem {
  return {
    ...makeRecord(overrides),
    itemDetails: { barcode: 'n/a' } as IBookModel,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /loan', () => {
  it('rejects non-staff accounts', async () => {
    const res = await request(app).get('/loan').set('Authorization', authHeaderFor('PATRON'));

    expect(res.status).toBe(403);
  });

  it('returns all records for staff', async () => {
    mockedLoanRecordDao.find.mockResolvedValue([makeRecord()]);

    const res = await request(app).get('/loan').set('Authorization', authHeaderFor('EMPLOYEE'));

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(1);
  });
});

describe('POST /loan', () => {
  const validPayload = {
    status: 'LOANED',
    loanedDate: '2026-01-01',
    dueDate: '2026-01-15',
    patron: PATRON_UUID,
    employeeOut: EMPLOYEE_UUID,
    item: ITEM_UUID,
  };

  it('creates a record for an authorized EMPLOYEE', async () => {
    mockedLoanRecordDao.insert.mockResolvedValue(makeRecord());

    const res = await request(app)
      .post('/loan')
      .set('Authorization', authHeaderFor('EMPLOYEE'))
      .send(validPayload);

    expect(res.status).toBe(201);
  });

  it('rejects a payload missing the required employeeOut field with 422', async () => {
    const { employeeOut, ...incomplete } = validPayload;

    const res = await request(app)
      .post('/loan')
      .set('Authorization', authHeaderFor('EMPLOYEE'))
      .send(incomplete);

    expect(res.status).toBe(422);
  });
});

describe('PUT /loan (mark-returned regression)', () => {
  it('accepts employeeOut: null when marking a book returned', async () => {
    const markedReturned = makeRecord({
      status: 'AVAILABLE',
      returnedDate: new Date('2026-01-10'),
      employeeOut: null,
    });
    mockedLoanRecordDao.updateById.mockResolvedValue(markedReturned);

    const res = await request(app)
      .put('/loan')
      .set('Authorization', authHeaderFor('EMPLOYEE'))
      .send({
        id: RECORD_UUID,
        status: 'AVAILABLE',
        loanedDate: '2026-01-01',
        dueDate: '2026-01-15',
        returnedDate: '2026-01-10',
        patron: PATRON_UUID,
        employeeOut: null,
        item: ITEM_UUID,
      });

    expect(res.status).toBe(200);
    expect(res.body.record.employeeOut).toBeNull();
  });

  it('rejects a payload that omits employeeOut entirely with 422', async () => {
    const res = await request(app)
      .put('/loan')
      .set('Authorization', authHeaderFor('EMPLOYEE'))
      .send({
        id: RECORD_UUID,
        status: 'AVAILABLE',
        loanedDate: '2026-01-01',
        dueDate: '2026-01-15',
        returnedDate: '2026-01-10',
        patron: PATRON_UUID,
        item: ITEM_UUID,
      });

    expect(res.status).toBe(422);
    expect(mockedLoanRecordDao.updateById).not.toHaveBeenCalled();
  });

  it("returns 404 when the record doesn't exist", async () => {
    mockedLoanRecordDao.updateById.mockResolvedValue(null);

    const res = await request(app).put('/loan').set('Authorization', authHeaderFor('ADMIN')).send({
      id: RECORD_UUID,
      status: 'AVAILABLE',
      loanedDate: '2026-01-01',
      dueDate: '2026-01-15',
      returnedDate: '2026-01-10',
      patron: PATRON_UUID,
      employeeOut: null,
      item: ITEM_UUID,
    });

    expect(res.status).toBe(404);
  });
});

describe('POST /loan/query', () => {
  it('lets a patron query their own records', async () => {
    mockedLoanRecordDao.findByProperty.mockResolvedValue([makeRecordWithItem()]);

    const res = await request(app)
      .post('/loan/query')
      .set('Authorization', authHeaderFor('PATRON', { id: PATRON_UUID }))
      .send({ property: 'patron', value: PATRON_UUID });

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(1);
  });

  it("blocks a patron from querying someone else's records", async () => {
    const res = await request(app)
      .post('/loan/query')
      .set('Authorization', authHeaderFor('PATRON', { id: PATRON_UUID }))
      .send({ property: 'patron', value: 'someone-else' });

    expect(res.status).toBe(403);
    expect(mockedLoanRecordDao.findByProperty).not.toHaveBeenCalled();
  });

  it("blocks a patron from querying by a property other than 'patron'", async () => {
    const res = await request(app)
      .post('/loan/query')
      .set('Authorization', authHeaderFor('PATRON', { id: PATRON_UUID }))
      .send({ property: 'status', value: 'LOANED' });

    expect(res.status).toBe(403);
  });

  it('lets staff query by any allowed property', async () => {
    mockedLoanRecordDao.findByProperty.mockResolvedValue([makeRecordWithItem()]);

    const res = await request(app)
      .post('/loan/query')
      .set('Authorization', authHeaderFor('EMPLOYEE'))
      .send({ property: 'status', value: 'LOANED' });

    expect(res.status).toBe(200);
  });
});

describe('POST /loan/self', () => {
  it('rejects staff accounts (patron-only route)', async () => {
    const res = await request(app)
      .post('/loan/self')
      .set('Authorization', authHeaderFor('EMPLOYEE'))
      .send({ item: ITEM_UUID, dueDate: '2099-01-01' });

    expect(res.status).toBe(403);
  });

  it('checks out an available item for a patron', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([]);
    mockedLoanRecordDao.insert.mockResolvedValue(makeRecord({ employeeOut: undefined }));

    const res = await request(app)
      .post('/loan/self')
      .set('Authorization', authHeaderFor('PATRON', { id: PATRON_UUID }))
      .send({ item: ITEM_UUID, dueDate: '2099-01-01' });

    expect(res.status).toBe(201);
  });

  it('returns 409 when the item is already loaned out', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([
      makeRecordWithItem({ status: 'LOANED', returnedDate: null }),
    ]);

    const res = await request(app)
      .post('/loan/self')
      .set('Authorization', authHeaderFor('PATRON', { id: PATRON_UUID }))
      .send({ item: ITEM_UUID, dueDate: '2099-01-01' });

    expect(res.status).toBe(409);
  });

  it('rejects a dueDate in the past with 422', async () => {
    const res = await request(app)
      .post('/loan/self')
      .set('Authorization', authHeaderFor('PATRON'))
      .send({ item: ITEM_UUID, dueDate: '2020-01-01' });

    expect(res.status).toBe(422);
  });
});

describe('GET /loan/availability/:itemId', () => {
  it('requires authentication', async () => {
    const res = await request(app).get(`/loan/availability/${ITEM_UUID}`);

    expect(res.status).toBe(401);
  });

  it('returns availability for a signed-in user', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([]);

    const res = await request(app)
      .get(`/loan/availability/${ITEM_UUID}`)
      .set('Authorization', authHeaderFor('PATRON'));

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });
});