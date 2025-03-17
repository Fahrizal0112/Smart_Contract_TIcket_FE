import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import './Navbar.css';

const Navbar = ({ address }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Web3 Ticketing</h1>
        <button className="menu-toggle" onClick={toggleMenu}>
          <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
        </button>
      </div>
      
      <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
        <NavLink 
          to="/create" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
          onClick={() => setIsMenuOpen(false)}
        >
          Buat Tiket
        </NavLink>
        <NavLink 
          to="/use" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
          onClick={() => setIsMenuOpen(false)}
        >
          Gunakan Tiket
        </NavLink>
        <NavLink 
          to="/access" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
          onClick={() => setIsMenuOpen(false)}
        >
          Kelola Akses
        </NavLink>
        <NavLink
          to="/transfer"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
          onClick={() => setIsMenuOpen(false)}
        >
          Transfer Tiket
        </NavLink>
        <NavLink
          to="/my-tickets"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
          onClick={() => setIsMenuOpen(false)}
        >
          Tiket Saya
        </NavLink>
        <NavLink 
          to="/scan" 
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
          onClick={() => setIsMenuOpen(false)}
        >
          Scan Tiket
        </NavLink>
        <NavLink 
          to="/buy" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
          onClick={() => setIsMenuOpen(false)}
        >
          Beli Tiket
        </NavLink>
      </div>

      <div className="navbar-account">
        <span className="account-address" title={address}>
          {window.innerWidth > 768 ? 'Your Wallet Address: ' : ''}{address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    </nav>
  );
};

export default Navbar; 