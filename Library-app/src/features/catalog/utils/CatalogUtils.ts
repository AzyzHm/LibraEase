import { Book } from "../../../models/Book";

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