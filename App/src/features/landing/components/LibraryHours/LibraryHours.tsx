import React from 'react';

import './LibraryHours.css';

export const LibraryHours:React.FC = () => {
  return (
    <div className="library-hours">
        <h3>Library Hours</h3>
        <table className="library-hours-table" id="hours">
            <tbody>
                <tr>
                    <td>Monday</td>
                    <td>10 AM - 6 PM</td>
                </tr>
                <tr>
                    <td>Tuesday</td>
                    <td>11 AM - 8 PM</td>
                </tr>
                <tr>
                    <td>Wednesday</td>
                    <td>10 AM - 6 PM</td>
                </tr>
                <tr>
                    <td>Thursday</td>
                    <td>11 AM - 8 PM</td>
                </tr>
                <tr>
                    <td>Friday</td>
                    <td>10 AM - 6 PM</td>
                </tr>
                <tr>
                    <td>Saturday</td>
                    <td>10 AM - 5 PM</td>
                </tr>
                <tr>
                    <td>Sunday</td>
                    <td>Closed</td>
                </tr>
            </tbody>
        </table>
    </div>
  );
};