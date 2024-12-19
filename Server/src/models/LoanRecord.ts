export interface ILoanRecord {
    status: 'AVAILABLE' | 'LOANED';
    loanedDate: Date;
    dueDate: Date;
    returnedDate: Date;
    patron: string;
    employeeOut: string;
    employeeIn?: string;
    item: string;
}