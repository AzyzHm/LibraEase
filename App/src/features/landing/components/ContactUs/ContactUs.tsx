import React from 'react';

import './ContactUs.css';

export const ContactUs:React.FC = () => {
    return (
        <div className="contact-us">
            <h3>Contact Us</h3>
            <h4>Address</h4>
            <p>12 Manouba Street</p>
            <p>ISAMM, UMA, 2608</p>
            <div className="contact-us-divider"></div>
            <h4>Phone</h4>
            <p>+216 25320190</p>
            <div className="contact-us-divider"></div>
            <h4>Email</h4>
            <p>LibraEase@isamm.u-manouba.tn</p>
        </div>
    )
}