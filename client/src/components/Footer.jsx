import React from 'react';
import './Footer.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <span>&copy; {new Date().getFullYear()} WLS Portal App. All rights reserved.</span>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#support">Support</a>
        </div>
      </div>
    </footer>
  );
}