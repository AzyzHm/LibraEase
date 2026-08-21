export interface ILoanRecord {
    status: 'AVAILABLE' | 'LOANED';
    loanedDate: Date;
    dueDate: Date;
    returnedDate?: Date | null;
    patron: string;
    employeeOut?: string | null;
    employeeIn?: string | null;
    item: string;
}