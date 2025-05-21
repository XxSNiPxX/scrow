import React from "react";
import "./Header.scss";

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header__logo">
        <span>MIPT Connect</span>
      </div>
      <nav className="header__nav">
        <a href="home" className="header__link">Home</a>
        <a href="listing" className="header__link">Listing</a>
        <a href="form" className="header__link">Form</a>
      </nav>
    </header>
  );
};

export default Header;
