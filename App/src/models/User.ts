export type User = {
    _id:string;
    type: 'ADMIN' | 'EMPLOYEE' | 'PATRON';
    firstname: string;
    lastname: string;
    email: string;
}

export interface LoginUserPayload {
    email: string;
    password: string;
}

export interface RegisterUserPayload {
    type: 'ADMIN' | 'EMPLOYEE' | 'PATRON';
    firstname: string;
    lastname: string;
    email: string;
    password: string;
}

export interface FetchUserPayload {
    userId : string;
    property : 'loggedInUser' | 'profileUser';
}