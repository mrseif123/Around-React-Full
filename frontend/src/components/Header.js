import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../images/header-vector.svg';

function Header(props) {
  return (
    <header className='header'>
      <img className='header__vector' src={logo} alt='logo' />
      <p className='header__email'>{props.loggedIn ? props.email : ''}</p>
      <Link
        to={props.link.to}
        className='header__link'
        onClick={props.onLogout ? props.onLogout : null}
      >
        {props.link.description}
      </Link>
    </header>
 )
}

export default Header;