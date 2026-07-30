import React from "react";
import './BookOfTheWeek.css';

import { BookInformation } from "../../../book";

export const BookOfTheWeek:React.FC = () => {
    return (
        <div className="book-of-the-week">
            <h1>Book of the week</h1>
            <BookInformation 
                book = {
                    {
                        _id: "1234",
                        barcode: "0679781587",
                        cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1409595968i/929.jpg",
                        title: "Memoirs of a Geisha",
                        authors: ["Arthur Golden"],
                        description: "A literary sensation and runaway bestseller, this brilliant novel presents with seamless authenticity and exquisite lyricism the true confessions of one of Japan's most celebrated geisha.In \"Memoirs of a Geisha,\" we enter a world where appearances are paramount; where a girl's virginity is auctioned to the highest bidder; where women are trained to beguile the most powerful men; and where love is scorned as illusion. It is a unique and triumphant work of fiction - at once romantic, erotic, suspenseful - and completely unforgettable.",
                        subjects: [
                            "Reading Level-Grade 11",
                            "Reading Level-Grade 12",
                            "Japan, fiction",
                            "Fiction, historical, general"
                        ],
                        publicationDate: new Date("1997-01-01T06:00:00.000Z"),
                        publisher: "Ted Smart",
                        pages: 503,
                        genre: "Fiction",
                        records: []
                    }
                }
            />
        </div>
    )
}