import request from "supertest";
import { createApp } from "../../src/app";
import * as LibraryCardDao from "../../src/daos/LibraryCardDao";
import { ILibraryCardWithUser } from "../../src/daos/LibraryCardDao";
import * as UserDao from "../../src/daos/UserDao";
import { IUserModel } from "../../src/daos/UserDao";
import { authHeaderFor } from "./helpers/authToken";

jest.mock("../../src/daos/LibraryCardDao");
jest.mock("../../src/daos/UserDao");

const mockedLibraryCardDao = LibraryCardDao as jest.Mocked<typeof LibraryCardDao>;
const mockedUserDao = UserDao as jest.Mocked<typeof UserDao>;
const app = createApp();

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_UUID = "22222222-2222-4222-8222-222222222222";
const CARD_UUID = "33333333-3333-4333-8333-333333333333";

function makeUser(overrides: Partial<IUserModel> = {}): IUserModel {
    return {
        id: VALID_UUID,
        type: "PATRON",
        firstname: "Jane",
        lastname: "Doe",
        email: "jane@example.com",
        password: "hashed-password",
        status: "APPROVED",
        ...overrides,
    };
}

function makeCard(overrides: Partial<ILibraryCardWithUser> = {}): ILibraryCardWithUser {
    return {
        id: CARD_UUID,
        user: VALID_UUID,
        userDetails: makeUser(),
        ...overrides,
    } as ILibraryCardWithUser;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe("GET /card", () => {
    it("rejects non-staff accounts", async () => {
        const res = await request(app).get("/card").set("Authorization", authHeaderFor("PATRON"));

        expect(res.status).toBe(403);
    });

    it("lists all cards for staff and strips the nested user's password", async () => {
        mockedLibraryCardDao.find.mockResolvedValue([makeCard()]);

        const res = await request(app).get("/card").set("Authorization", authHeaderFor("EMPLOYEE"));

        expect(res.status).toBe(200);
        expect(res.body.cards[0].userDetails.password).toBeUndefined();
    });
});

describe("GET /card/me", () => {
    it("returns the caller's own card", async () => {
        mockedLibraryCardDao.findByUserId.mockResolvedValue(makeCard());

        const res = await request(app)
            .get("/card/me")
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }));

        expect(res.status).toBe(200);
        expect(mockedLibraryCardDao.findByUserId).toHaveBeenCalledWith(VALID_UUID);
    });

    it("returns 404 with a helpful message when the caller has no card yet", async () => {
        mockedLibraryCardDao.findByUserId.mockResolvedValue(null);

        const res = await request(app)
            .get("/card/me")
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }));

        expect(res.status).toBe(404);
    });
});

describe("GET /card/:cardId", () => {
    it("lets the card's owner view it", async () => {
        mockedLibraryCardDao.findById.mockResolvedValue(makeCard());

        const res = await request(app)
            .get(`/card/${CARD_UUID}`)
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }));

        expect(res.status).toBe(200);
    });

    it("blocks a different patron from viewing someone else's card", async () => {
        mockedLibraryCardDao.findById.mockResolvedValue(makeCard());

        const res = await request(app)
            .get(`/card/${CARD_UUID}`)
            .set("Authorization", authHeaderFor("PATRON", { id: OTHER_UUID }));

        expect(res.status).toBe(403);
    });

    it("returns 404 for a card that doesn't exist", async () => {
        mockedLibraryCardDao.findById.mockResolvedValue(null);

        const res = await request(app)
            .get(`/card/${CARD_UUID}`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(404);
    });
});

describe("POST /card", () => {
    it("blocks a patron from requesting a card for someone else", async () => {
        const res = await request(app)
            .post("/card")
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }))
            .send({ user: OTHER_UUID });

        expect(res.status).toBe(403);
    });

    it("rejects issuing a card to the admin account", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "ADMIN" }));

        const res = await request(app)
            .post("/card")
            .set("Authorization", authHeaderFor("ADMIN"))
            .send({ user: VALID_UUID });

        expect(res.status).toBe(400);
        expect(mockedLibraryCardDao.insert).not.toHaveBeenCalled();
    });

    it("creates a card for a patron", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "PATRON" }));
        mockedLibraryCardDao.insert.mockResolvedValue(makeCard() as any);
        mockedLibraryCardDao.findByUserId.mockResolvedValue(makeCard());

        const res = await request(app)
            .post("/card")
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }))
            .send({ user: VALID_UUID });

        expect(res.status).toBe(201);
    });

    it("rejects a payload with a malformed user id with 422", async () => {
        const res = await request(app)
            .post("/card")
            .set("Authorization", authHeaderFor("ADMIN"))
            .send({ user: "not-a-uuid" });

        expect(res.status).toBe(422);
    });
});