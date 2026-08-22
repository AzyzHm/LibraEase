import { signAuthToken } from "../../../src/utils/Jwt";
import { IUserModel } from "../../../src/daos/UserDao";

export function authHeaderFor(
    type: IUserModel["type"],
    overrides: Partial<Pick<IUserModel, "id" | "email">> = {}
): string {
    const user: IUserModel = {
        id: overrides.id ?? `${type.toLowerCase()}-id`,
        type,
        firstname: "Test",
        lastname: "User",
        email: overrides.email ?? `${type.toLowerCase()}@example.com`,
        password: "irrelevant-for-token",
    };

    return `Bearer ${signAuthToken(user)}`;
}