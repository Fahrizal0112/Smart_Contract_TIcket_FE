import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ address, isMinter }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Web3 Ticketing</h1>
      </div>
      
      <div className="navbar-menu">
        <NavLink 
          to="/create" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          Buat Tiket
        </NavLink>
        <NavLink 
          to="/use" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          Gunakan Tiket
        </NavLink>
        <NavLink 
          to="/access" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          Kelola Akses
        </NavLink>
        <NavLink
          to="/transfer"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          Transfer Tiket
        </NavLink>
        <NavLink
          to="/my-tickets"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          Tiket Saya
        </NavLink>
          <NavLink to="/scan" className="nav-link">
            Scan Tiket
          </NavLink>
        <NavLink 
          to="/buy" 
          className={({ isActive }) => 
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          Beli Tiket
        </NavLink>
      </div>

      <div className="navbar-account">
        <span className="account-address" title={address}>
          Your Wallet Address : {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    </nav>
  );
};

export default Navbar; 