import { Book } from "../../../models/Book";
import { PageInfo } from "../../../models/Page";

export function generateRandomGenres():string[] {
    let choices = ['Biography','Childrens','Fantasy','Fiction','Non-Fiction','Romance','Science Fiction','Young Adult','horror'];
    
    let choosen:string[] = [];

    while(choosen.length !== 5){
        let num = Math.floor(Math.random() * choices.length);
        if(!choosen.includes(choices[num])){
            choosen.push(choices[num]);
        }
    }

    return choosen;
}

export function getRandomBooksByGenre(genre:string,books:Book[]):Book[]{
    let filteredBooks = books.filter(book => book.genre === genre);

    let randomBooks:Book[] = [];

    if(filteredBooks.length < 10) return filteredBooks;

    while(randomBooks.length !== 10){
        let index = Math.floor(Math.random() * filteredBooks.length);
        if(!randomBooks.some(b => b['barcode'] === filteredBooks[index].barcode)){
            randomBooks.push(filteredBooks[index]);
        }
    }
    return randomBooks;
}

export function calculatePaging(pageInfo:PageInfo):string[]{
    let pArray:string[] = [];

    if(pageInfo){
        let total = pageInfo?.totalPages;
        let current = pageInfo?.currentPage;

        if(total <= 10) {
            for(let i = 1;i<= total;i++){
                pArray.push(`${i}`);
            }
        }else if(total > 10 && current - 7 <= 0){
            for(let i = 1;i <= 8;i++){
                pArray.push(`${i}`);
            }

            pArray.push('...');
            for(let i = total - 1;i <= total;i++){
                pArray.push(`${i}`);
            }
        }else if(total > 10 && total - 7 > 0 && total - current > 5){
            for(let i = 1;i <= 2;i++){
                pArray.push(`${i}`);
            }

            pArray.push('...');

            for(let i = current;i <= current + 4;i++){
                pArray.push(`${i}`);
            }

            pArray.push('...');

            for(let i = total - 1;i <= total;i++){
                pArray.push(`${i}`);
            }
        }else {
            for(let i = 1;i <= 2;i++){
                pArray.push(`${i}`);
            }
            pArray.push('...');
            for(let i = total - 5;i <= total;i++){
                    pArray.push(`${i}`);
            }   
        }
    }

    return pArray;
}