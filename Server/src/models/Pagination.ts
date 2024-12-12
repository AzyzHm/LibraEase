export interface IPagination<T> {
    totalCount : number,
    currentPage: number;
    totalPages: number,
    limit: number,
    pageCount: number,
    items: T[]
}