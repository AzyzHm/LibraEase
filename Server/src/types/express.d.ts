import { AuthTokenPayload } from '../utils/Jwt';

declare global {
    namespace Express {
        interface Request {
            /** Set by the `authenticate` middleware once a valid Bearer token is verified. */
            user?: AuthTokenPayload;
        }
    }
}

export {};