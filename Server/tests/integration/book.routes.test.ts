import request from "supertest";
import { createApp } from "../../src/app";
import * as BookDao from "../../src/daos/BookDao";
import { IBookModel } from "../../src/daos/BookDao";
import { authHeaderFor } from "./helpers/authToken";

jest.mock("../../src/daos/BookDao");

const mockedBookDao = BookDao as jest.Mocked<typeof BookDao>;
const app = createApp();

function makeBook(overrides: Partial<IBookModel> = {}): IBookModel {
    return {
        id: "book-1",
        barcode: "0306406152",
        cover: "cover.jpg",
        title: "The Pragmatic Programmer",
        authors: ["Andrew Hunt"],
        description: "A great book",
        subjects: ["Software"],
        publicationDate: new Date("2020-01-01"),
        publisher: "Addison-Wesley",
        pages: 352,
        genre: "Technology",
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe("GET /book", () => {
    it("returns all books with no authentication required", async () => {
        mockedBookDao.find.mockResolvedValue([makeBook()]);

        const res = await request(app).get("/book");

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(res.body.books).toHaveLength(1);
    });
});

describe("GET /book/query", () => {
    it("returns paginated search results", async () => {
        mockedBookDao.search.mockResolvedValue({ items: [makeBook()], totalCount: 1 });

        const res = await request(app).get("/book/query").query({ title: "Pragmatic" });

        expect(res.status).toBe(200);
        expect(res.body.page.items).toHaveLength(1);
        expect(res.body.page.totalCount).toBe(1);
    });
});

describe("POST /book", () => {
    const validPayload = {
        barcode: "0306406152",
        cover: "cover.jpg",
        title: "The Pragmatic Programmer",
        authors: ["Andrew Hunt"],
        description: "A great book",
        subjects: ["Software"],
        publicationDate: "2020-01-01",
        publisher: "Addison-Wesley",
        pages: 352,
        genre: "Technology",
    };

    it("rejects requests with no Authorization header", async () => {
        const res = await request(app).post("/book").send(validPayload);

        expect(res.status).toBe(401);
    });

    it("rejects PATRON accounts (authorize gate)", async () => {
        const res = await request(app)
            .post("/book")
            .set("Authorization", authHeaderFor("PATRON"))
            .send(validPayload);

        expect(res.status).toBe(403);
    });

    it("rejects a payload missing required fields with 422", async () => {
        const { title, ...incomplete } = validPayload;

        const res = await request(app)
            .post("/book")
            .set("Authorization", authHeaderFor("EMPLOYEE"))
            .send(incomplete);

        expect(res.status).toBe(422);
    });

    it("rejects a barcode that is neither valid ISBN-10 nor ISBN-13 with 422", async () => {
        const res = await request(app)
            .post("/book")
            .set("Authorization", authHeaderFor("EMPLOYEE"))
            .send({ ...validPayload, barcode: "12345" });

        expect(res.status).toBe(422);
    });

    it("accepts an ISBN-10 barcode ending in the X check digit", async () => {
        mockedBookDao.insert.mockResolvedValue(makeBook({ barcode: "030640615X" }));

        const res = await request(app)
            .post("/book")
            .set("Authorization", authHeaderFor("EMPLOYEE"))
            .send({ ...validPayload, barcode: "030640615X" });

        expect(res.status).toBe(201);
        expect(res.body.savedBook.barcode).toBe("030640615X");
    });

    it("creates a book for an ADMIN with a valid payload", async () => {
        mockedBookDao.insert.mockResolvedValue(makeBook());

        const res = await request(app)
            .post("/book")
            .set("Authorization", authHeaderFor("ADMIN"))
            .send(validPayload);

        expect(res.status).toBe(201);
        expect(mockedBookDao.insert).toHaveBeenCalledTimes(1);
    });
});

describe("PUT /book", () => {
    const validUpdate = {
        id: "11111111-1111-4111-8111-111111111111",
        barcode: "0306406152",
        cover: "cover.jpg",
        title: "Updated Title",
        authors: ["Andrew Hunt"],
        description: "A great book",
        subjects: ["Software"],
        publicationDate: "2020-01-01",
        publisher: "Addison-Wesley",
        pages: 352,
        genre: "Technology",
    };

    it("updates a book for an authorized EMPLOYEE", async () => {
        mockedBookDao.updateByBarcode.mockResolvedValue(makeBook({ title: "Updated Title" }));

        const res = await request(app)
            .put("/book")
            .set("Authorization", authHeaderFor("EMPLOYEE"))
            .send(validUpdate);

        expect(res.status).toBe(200);
        expect(res.body.updatedBook.title).toBe("Updated Title");
    });

    it("returns 404 when the barcode does not match any book", async () => {
        mockedBookDao.updateByBarcode.mockResolvedValue(null);

        const res = await request(app)
            .put("/book")
            .set("Authorization", authHeaderFor("ADMIN"))
            .send(validUpdate);

        expect(res.status).toBe(404);
    });
});

describe("DELETE /book/:barcode", () => {
    it("deletes a book for an authorized ADMIN", async () => {
        mockedBookDao.removeByBarcode.mockResolvedValue(makeBook());

        const res = await request(app)
            .delete("/book/0306406152")
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
    });

    it("rejects a malformed barcode param with 422 before hitting the DAO", async () => {
        const res = await request(app)
            .delete("/book/not-a-barcode")
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(422);
        expect(mockedBookDao.removeByBarcode).not.toHaveBeenCalled();
    });

    it("returns 404 when there is nothing to delete", async () => {
        mockedBookDao.removeByBarcode.mockResolvedValue(null);

        const res = await request(app)
            .delete("/book/0306406152")
            .set("Authorization", authHeaderFor("EMPLOYEE"));

        expect(res.status).toBe(404);
    });
});