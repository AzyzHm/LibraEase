import { BookOfTheWeek, ContactUs, LibraryCard, LibraryHours, UpcomingEvents } from "../../features/landing";
import './HomePage.css';

export default function HomePage(): JSX.Element {

  return (
    <div className="page">
      <div className="home-page-container">
        <div className="home-page-left">
            <BookOfTheWeek />
            <UpcomingEvents />
            <LibraryCard /> 
        </div>
        <div className="home-page-right">
            <LibraryHours />
            <ContactUs />
        </div>
      </div>
    </div>
  )
}