import React from "react";

import './UpcomingEvents.css';
import { AutoAwesome } from "@mui/icons-material";


export const UpcomingEvents:React.FC = () => {
    return(
        <div className="upcoming-events">
            <div className="upcoming-events-header-group">
                <AutoAwesome sx={{
                    fontSize: "2.25rem",
                    color: "#3626A7"
                }}
                />
                <h2>Upcoming Events</h2>
                <AutoAwesome sx={{
                    fontSize: "2.25rem",
                    color: "#3626A7"
                }}
                />
            </div>
            <h3>This Summer</h3>
            <h4>Tuesday's: 10:00 AM - Noon</h4>
            <ul className="upcoming-events-event">
                <li><p>Who: Children to 6th grade</p></li>
                <li><p>Activities: Logic Puzzles, Scratch Programming</p></li>
            </ul>
            <h4>Wednesday's: 10:00 AM - Noon</h4>
            <ul className="upcoming-events-event">
                <li><p>Who: Adults (19+)</p></li>
                <li><p>Activities: Craft and sip - Come enjoy a nice beverage and craft</p></li>
            </ul>
            <h4>Thursday's: 10:00 AM - Noon</h4>
            <ul className="upcoming-events-event">
                <li><p>Who: Teens (13-18)</p></li>
                <li><p>Activities: Data Analysis Course : Learn Pandas,Matplotlib and Seaborn Libraries</p></li>
            </ul>
        </div>
    )
}