import bcrypt from "bcryptjs";
import * as UserDao from "../../../src/daos/UserDao";
import { IUserModel } from "../../../src/daos/UserDao";
import * as UserService from "../../../src/services/UserService";
import { IUser } from "../../../src/models/User";
import {
    UnableToSaveUserError,
    UnableToFetchUserError,
    UserDoesNotExistError,
    AccountPendingApprovalError,
    InvalidRoleTransitionError,
} from "../../../src/utils/LibraryErrors";

jest.mock("../../../src/daos/UserDao");
jest.mock("bcryptjs");

const mockedUserDao = UserDao as jest.Mocked<typeof UserDao>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeUser(overrides: Partial<IUserModel> = {}): IUserModel {
    return {
        id: "user-1",
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

describe("UserService.register", () => {
    it("hashes the password and stores a PENDING patron", async () => {
        const payload: IUser = {
            type: "PATRON",
            firstname: "Jane",
            lastname: "Doe",
            email: "jane@example.com",
            password: "plain-password",
        };
        mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
        mockedUserDao.insert.mockResolvedValue(makeUser({ status: "PENDING" }));

        const result = await UserService.register(payload);

        expect(mockedBcrypt.hash).toHaveBeenCalledWith("plain-password", expect.any(Number));
        expect(mockedUserDao.insert).toHaveBeenCalledWith({
            ...payload,
            type: "PATRON",
            password: "hashed-password",
            status: "PENDING",
        });
        expect(result.status).toBe("PENDING");
    });

    it("wraps a Postgres unique-violation into UnableToSaveUserError", async () => {
        mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
        mockedUserDao.insert.mockRejectedValue({ code: "23505", message: "duplicate key" });

        await expect(
            UserService.register({
                type: "PATRON",
                firstname: "Jane",
                lastname: "Doe",
                email: "jane@example.com",
                password: "plain-password",
            })
        ).rejects.toThrow(UnableToSaveUserError);
    });

    it("wraps any other DAO failure into UnableToSaveUserError", async () => {
        mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
        mockedUserDao.insert.mockRejectedValue(new Error("connection reset"));

        await expect(
            UserService.register({
                type: "PATRON",
                firstname: "Jane",
                lastname: "Doe",
                email: "jane@example.com",
                password: "plain-password",
            })
        ).rejects.toThrow(UnableToSaveUserError);
    });
});

describe("UserService.login", () => {
    it("returns the user when the email exists, password matches, and the account is approved", async () => {
        const user = makeUser();
        mockedUserDao.findByEmail.mockResolvedValue(user);
        mockedBcrypt.compare.mockResolvedValue(true as never);

        const result = await UserService.login({ email: user.email, password: "plain-password" });

        expect(result).toEqual(user);
    });

    it("throws UnableToFetchUserError when no user has that email", async () => {
        mockedUserDao.findByEmail.mockResolvedValue(null);

        await expect(UserService.login({ email: "nobody@example.com", password: "x" })).rejects.toThrow(
            UnableToFetchUserError
        );
    });

    it("throws UnableToFetchUserError when the password does not match", async () => {
        mockedUserDao.findByEmail.mockResolvedValue(makeUser());
        mockedBcrypt.compare.mockResolvedValue(false as never);

        await expect(UserService.login({ email: "jane@example.com", password: "wrong" })).rejects.toThrow(
            UnableToFetchUserError
        );
    });

    it("throws AccountPendingApprovalError when the account status is PENDING", async () => {
        mockedUserDao.findByEmail.mockResolvedValue(makeUser({ status: "PENDING" }));
        mockedBcrypt.compare.mockResolvedValue(true as never);

        await expect(UserService.login({ email: "jane@example.com", password: "plain-password" })).rejects.toThrow(
            AccountPendingApprovalError
        );
    });

    it("throws AccountPendingApprovalError when the account status is REJECTED", async () => {
        mockedUserDao.findByEmail.mockResolvedValue(makeUser({ status: "REJECTED" }));
        mockedBcrypt.compare.mockResolvedValue(true as never);

        await expect(UserService.login({ email: "jane@example.com", password: "plain-password" })).rejects.toThrow(
            AccountPendingApprovalError
        );
    });
});

describe("UserService.findAllUsers", () => {
    it("returns the users from the DAO", async () => {
        const users = [makeUser(), makeUser({ id: "user-2" })];
        mockedUserDao.find.mockResolvedValue(users);

        const result = await UserService.findAllUsers();

        expect(result).toEqual(users);
    });

    it("swallows DAO errors and returns an empty array", async () => {
        mockedUserDao.find.mockRejectedValue(new Error("db down"));

        const result = await UserService.findAllUsers();

        expect(result).toEqual([]);
    });
});

describe("UserService.findPendingUsers", () => {
    it("filters the full user list down to PENDING accounts", async () => {
        mockedUserDao.find.mockResolvedValue([
            makeUser({ id: "u1", status: "PENDING" }),
            makeUser({ id: "u2", status: "APPROVED" }),
            makeUser({ id: "u3", status: "PENDING" }),
        ]);

        const result = await UserService.findPendingUsers();

        expect(result.map((u) => u.id)).toEqual(["u1", "u3"]);
    });
});

describe("UserService.findUserById", () => {
    it("returns the user when found", async () => {
        const user = makeUser();
        mockedUserDao.findById.mockResolvedValue(user);

        const result = await UserService.findUserById("user-1");

        expect(result).toEqual(user);
    });

    it("throws UserDoesNotExistError when not found", async () => {
        mockedUserDao.findById.mockResolvedValue(null);

        await expect(UserService.findUserById("missing")).rejects.toThrow(UserDoesNotExistError);
    });
});

describe("UserService.modifyUser", () => {
    it("strips password and type before updating, and returns the updated user", async () => {
        const updated = makeUser({ firstname: "Janet" });
        mockedUserDao.updateById.mockResolvedValue(updated);

        const result = await UserService.modifyUser(
            makeUser({ firstname: "Janet", password: "should-be-stripped" })
        );

        expect(mockedUserDao.updateById).toHaveBeenCalledWith("user-1", {
            id: "user-1",
            firstname: "Janet",
            lastname: "Doe",
            email: "jane@example.com",
            status: "APPROVED",
        });
        expect(result).toEqual(updated);
    });

    it("throws UserDoesNotExistError when the DAO finds nothing to update", async () => {
        mockedUserDao.updateById.mockResolvedValue(null);

        await expect(UserService.modifyUser(makeUser())).rejects.toThrow(UserDoesNotExistError);
    });
});

describe("UserService.promoteUser", () => {
    it("promotes a PATRON to EMPLOYEE", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "PATRON" }));
        mockedUserDao.updateById.mockResolvedValue(makeUser({ type: "EMPLOYEE" }));

        const result = await UserService.promoteUser("user-1");

        expect(mockedUserDao.updateById).toHaveBeenCalledWith("user-1", { type: "EMPLOYEE" });
        expect(result.type).toBe("EMPLOYEE");
    });

    it("throws UserDoesNotExistError when the target user does not exist", async () => {
        mockedUserDao.findById.mockResolvedValue(null);

        await expect(UserService.promoteUser("missing")).rejects.toThrow(UserDoesNotExistError);
    });

    it("throws InvalidRoleTransitionError when the target is already an ADMIN", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "ADMIN" }));

        await expect(UserService.promoteUser("user-1")).rejects.toThrow(InvalidRoleTransitionError);
    });

    it("throws InvalidRoleTransitionError when the target is already an EMPLOYEE", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "EMPLOYEE" }));

        await expect(UserService.promoteUser("user-1")).rejects.toThrow(InvalidRoleTransitionError);
    });
});

describe("UserService.demoteUser", () => {
    it("demotes an EMPLOYEE to PATRON", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "EMPLOYEE" }));
        mockedUserDao.updateById.mockResolvedValue(makeUser({ type: "PATRON" }));

        const result = await UserService.demoteUser("user-1");

        expect(mockedUserDao.updateById).toHaveBeenCalledWith("user-1", { type: "PATRON" });
        expect(result.type).toBe("PATRON");
    });

    it("throws UserDoesNotExistError when the target user does not exist", async () => {
        mockedUserDao.findById.mockResolvedValue(null);

        await expect(UserService.demoteUser("missing")).rejects.toThrow(UserDoesNotExistError);
    });

    it("throws InvalidRoleTransitionError when the target is already an ADMIN", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "ADMIN" }));

        await expect(UserService.demoteUser("user-1")).rejects.toThrow(InvalidRoleTransitionError);
    });

    it("throws InvalidRoleTransitionError when the target is already a PATRON", async () => {
        mockedUserDao.findById.mockResolvedValue(makeUser({ type: "PATRON" }));

        await expect(UserService.demoteUser("user-1")).rejects.toThrow(InvalidRoleTransitionError);
    });
});

describe("UserService.approveUser / rejectUser", () => {
    it("approveUser sets status to APPROVED", async () => {
        mockedUserDao.updateById.mockResolvedValue(makeUser({ status: "APPROVED" }));

        const result = await UserService.approveUser("user-1");

        expect(mockedUserDao.updateById).toHaveBeenCalledWith("user-1", { status: "APPROVED" });
        expect(result.status).toBe("APPROVED");
    });

    it("approveUser throws UserDoesNotExistError when nothing was updated", async () => {
        mockedUserDao.updateById.mockResolvedValue(null);

        await expect(UserService.approveUser("missing")).rejects.toThrow(UserDoesNotExistError);
    });

    it("rejectUser sets status to REJECTED", async () => {
        mockedUserDao.updateById.mockResolvedValue(makeUser({ status: "REJECTED" }));

        const result = await UserService.rejectUser("user-1");

        expect(mockedUserDao.updateById).toHaveBeenCalledWith("user-1", { status: "REJECTED" });
        expect(result.status).toBe("REJECTED");
    });

    it("rejectUser throws UserDoesNotExistError when nothing was updated", async () => {
        mockedUserDao.updateById.mockResolvedValue(null);

        await expect(UserService.rejectUser("missing")).rejects.toThrow(UserDoesNotExistError);
    });
});

describe("UserService.removeUser", () => {
    it("returns a success message when the DAO deletes the user", async () => {
        mockedUserDao.removeById.mockResolvedValue(makeUser());

        const result = await UserService.removeUser("user-1");

        expect(result).toBe("User deleted successfully");
    });

    it("throws UserDoesNotExistError when there is nothing to delete", async () => {
        mockedUserDao.removeById.mockResolvedValue(null);

        await expect(UserService.removeUser("missing")).rejects.toThrow(UserDoesNotExistError);
    });
});