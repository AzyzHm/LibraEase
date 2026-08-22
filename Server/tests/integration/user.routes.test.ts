import request from "supertest";
import { createApp } from "../../src/app";
import * as UserDao from "../../src/daos/UserDao";
import { IUserModel } from "../../src/daos/UserDao";
import { authHeaderFor } from "./helpers/authToken";

jest.mock("../../src/daos/UserDao");

const mockedUserDao = UserDao as jest.Mocked<typeof UserDao>;
const app = createApp();

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_UUID = "22222222-2222-4222-8222-222222222222";

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

beforeEach(() => {
    jest.clearAllMocks();
});

describe("GET /users", () => {
    it("rejects unauthenticated requests", async () => {
        const res = await request(app).get("/users");

        expect(res.status).toBe(401);
    });

    it("rejects PATRON accounts", async () => {
        const res = await request(app).get("/users").set("Authorization", authHeaderFor("PATRON"));

        expect(res.status).toBe(403);
    });

    it("lets an EMPLOYEE see only PATRON accounts", async () => {
        mockedUserDao.find.mockResolvedValue([
            makeUser({ id: "u1", type: "PATRON" }),
            makeUser({ id: "u2", type: "EMPLOYEE" }),
            makeUser({ id: "u3", type: "ADMIN" }),
        ]);

        const res = await request(app).get("/users").set("Authorization", authHeaderFor("EMPLOYEE"));

        expect(res.status).toBe(200);
        expect(res.body.users).toHaveLength(1);
        expect(res.body.users[0].id).toBe("u1");
    });

    it("lets an ADMIN see everyone except other admins", async () => {
        mockedUserDao.find.mockResolvedValue([
            makeUser({ id: "u1", type: "PATRON" }),
            makeUser({ id: "u2", type: "EMPLOYEE" }),
            makeUser({ id: "u3", type: "ADMIN" }),
        ]);

        const res = await request(app).get("/users").set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
        expect(res.body.users.map((u: any) => u.id)).toEqual(["u1", "u2"]);
    });

    it("never leaks password fields", async () => {
        mockedUserDao.find.mockResolvedValue([makeUser({ id: "u1", type: "PATRON" })]);

        const res = await request(app).get("/users").set("Authorization", authHeaderFor("ADMIN"));

        expect(res.body.users[0].password).toBeUndefined();
    });
});

describe("GET /users/pending", () => {
    it("rejects non-ADMIN accounts", async () => {
        const res = await request(app).get("/users/pending").set("Authorization", authHeaderFor("EMPLOYEE"));

        expect(res.status).toBe(403);
    });

    it("returns pending users for an ADMIN", async () => {
        mockedUserDao.find.mockResolvedValue([
            makeUser({ id: "u1", status: "PENDING" }),
            makeUser({ id: "u2", status: "APPROVED" }),
        ]);

        const res = await request(app).get("/users/pending").set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
        expect(res.body.users).toHaveLength(1);
    });
});

describe("GET /users/:userId", () => {
    it("rejects a malformed userId param with 422", async () => {
        const res = await request(app)
            .get("/users/not-a-uuid")
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(422);
    });

    it("lets a PATRON view their own account", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser());

        const res = await request(app)
            .get(`/users/${VALID_UUID}`)
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }));

        expect(res.status).toBe(200);
    });

    it("blocks a PATRON from viewing someone else's account", async () => {
        const res = await request(app)
            .get(`/users/${OTHER_UUID}`)
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }));

        expect(res.status).toBe(403);
        expect(mockedUserDao.findById).not.toHaveBeenCalled();
    });

    it("returns 404 when the user does not exist", async () => {
        mockedUserDao.findById.mockResolvedValue(null);

        const res = await request(app)
            .get(`/users/${VALID_UUID}`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(404);
    });
});

describe("DELETE /users/:userId", () => {
    it("lets a user delete their own account", async () => {
        mockedUserDao.removeById.mockResolvedValue(makeUser());

        const res = await request(app)
            .delete(`/users/${VALID_UUID}`)
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }));

        expect(res.status).toBe(200);
    });

    it("blocks a non-admin from deleting someone else's account", async () => {
        const res = await request(app)
            .delete(`/users/${OTHER_UUID}`)
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }));

        expect(res.status).toBe(403);
        expect(mockedUserDao.removeById).not.toHaveBeenCalled();
    });

    it("lets an ADMIN delete any account", async () => {
        mockedUserDao.removeById.mockResolvedValue(makeUser());

        const res = await request(app)
            .delete(`/users/${OTHER_UUID}`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
    });
});

describe("PUT /users", () => {
    const validUpdate = {
        id: VALID_UUID,
        type: "PATRON",
        firstname: "Janet",
        lastname: "Doe",
        email: "jane@example.com",
    };

    it("blocks a non-admin from updating someone else's account", async () => {
        const res = await request(app)
            .put("/users")
            .set("Authorization", authHeaderFor("PATRON", { id: OTHER_UUID }))
            .send(validUpdate);

        expect(res.status).toBe(403);
    });

    it("never sends a type field to the DAO, so a non-admin can't smuggle a role change through", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "PATRON" }));
        mockedUserDao.updateById.mockResolvedValue(makeUser({ type: "PATRON", firstname: "Janet" }));

        const res = await request(app)
            .put("/users")
            .set("Authorization", authHeaderFor("PATRON", { id: VALID_UUID }))
            .send({ ...validUpdate, type: "ADMIN" });

        expect(res.status).toBe(200);
        const [, payloadSentToDao] = mockedUserDao.updateById.mock.calls[0];
        expect(payloadSentToDao).not.toHaveProperty("type");
    });

    it("lets an ADMIN update any account, including role", async () => {
        mockedUserDao.updateById.mockResolvedValue(makeUser({ type: "EMPLOYEE" }));

        const res = await request(app)
            .put("/users")
            .set("Authorization", authHeaderFor("ADMIN"))
            .send({ ...validUpdate, type: "EMPLOYEE" });

        expect(res.status).toBe(200);
        expect(mockedUserDao.findById).not.toHaveBeenCalled();
    });
});

describe("PUT /users/:userId/promote and /demote", () => {
    it("rejects non-ADMIN callers", async () => {
        const res = await request(app)
            .put(`/users/${VALID_UUID}/promote`)
            .set("Authorization", authHeaderFor("EMPLOYEE"));

        expect(res.status).toBe(403);
    });

    it("promotes a patron to employee for an ADMIN", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "PATRON" }));
        mockedUserDao.updateById.mockResolvedValue(makeUser({ type: "EMPLOYEE" }));

        const res = await request(app)
            .put(`/users/${VALID_UUID}/promote`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
        expect(res.body.user.type).toBe("EMPLOYEE");
    });

    it("returns 409 when trying to promote an admin", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "ADMIN" }));

        const res = await request(app)
            .put(`/users/${VALID_UUID}/promote`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(409);
    });

    it("demotes an employee to patron for an ADMIN", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "EMPLOYEE" }));
        mockedUserDao.updateById.mockResolvedValue(makeUser({ type: "PATRON" }));

        const res = await request(app)
            .put(`/users/${VALID_UUID}/demote`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
        expect(res.body.user.type).toBe("PATRON");
    });
});

describe("PUT /users/:userId/approve and /reject", () => {
    it("approves a pending user for an ADMIN", async () => {
        mockedUserDao.updateById.mockResolvedValue(makeUser({ status: "APPROVED" }));

        const res = await request(app)
            .put(`/users/${VALID_UUID}/approve`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
        expect(res.body.user.status).toBe("APPROVED");
    });

    it("rejects a pending user for an ADMIN", async () => {
        mockedUserDao.updateById.mockResolvedValue(makeUser({ status: "REJECTED" }));

        const res = await request(app)
            .put(`/users/${VALID_UUID}/reject`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(200);
        expect(res.body.user.status).toBe("REJECTED");
    });

    it("returns 404 when approving a user that doesn't exist", async () => {
        mockedUserDao.updateById.mockResolvedValue(null);

        const res = await request(app)
            .put(`/users/${VALID_UUID}/approve`)
            .set("Authorization", authHeaderFor("ADMIN"));

        expect(res.status).toBe(404);
    });
});