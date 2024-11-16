export interface IUser {
    type: 'ADMIN' | 'EMPLOYEE' | 'PATRON';
    firstname: string;
    lastname: string;
    email: string;
    password: string;
}