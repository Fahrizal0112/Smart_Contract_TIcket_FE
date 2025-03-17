import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './AccessManager.css';

const AccessManager = ({ provider, signer }) => {
  const [newAddress, setNewAddress] = useState('');
  const [authorizedAddresses, setAuthorizedAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadAuthorizedAddresses();
  }, [signer]);

  const checkAdminStatus = async () => {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );
      const currentAddress = await signer.getAddress();
      
      // Periksa apakah address adalah admin/minter
      const isCurrentAdmin = await contract.isMinter(currentAddress);
      console.log("Is admin?", isCurrentAdmin);
      
      setIsAdmin(isCurrentAdmin);
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Gagal memeriksa status admin");
    }
  };

  const loadAuthorizedAddresses = async () => {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );
      
      // Dapatkan semua event AddMinter
      const addFilter = contract.filters.MinterAdded();
      const removeFilter = contract.filters.MinterRemoved();
      
      const addEvents = await contract.queryFilter(addFilter);
      const removeEvents = await contract.queryFilter(removeFilter);
      
      // Proses events untuk mendapatkan daftar minter yang aktif
      const minterSet = new Set();
      
      for (let event of addEvents) {
        minterSet.add(event.args[0].toLowerCase());
      }
      
      for (let event of removeEvents) {
        minterSet.delete(event.args[0].toLowerCase());
      }
      
      // Verifikasi setiap address masih minter
      const verifiedMinters = [];
      for (let address of minterSet) {
        const isMinter = await contract.isMinter(address);
        if (isMinter) {
          verifiedMinters.push(address);
        }
      }
      
      setAuthorizedAddresses(verifiedMinters);
    } catch (err) {
      console.error("Error loading authorized addresses:", err);
      setError("Gagal memuat daftar minter");
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(newAddress)) {
      setError("Alamat wallet tidak valid");
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        signer
      );

      const tx = await contract.addMinter(newAddress);
      await tx.wait();

      setSuccess(`Alamat ${newAddress} berhasil ditambahkan sebagai minter`);
      setNewAddress('');
      loadAuthorizedAddresses(); // Refresh daftar
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAddress = async (address) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        signer
      );

      const tx = await contract.removeMinter(address);
      await tx.wait();

      setSuccess(`Alamat ${address} berhasil dihapus dari minter`);
      loadAuthorizedAddresses(); // Refresh daftar
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="access-manager-container">
        <div className="not-owner-message">
          <h2>Akses Terbatas</h2>
          <p>Maaf, hanya admin yang dapat mengelola akses minter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="access-manager-container">
      <h2>Kelola Akses Minter</h2>

      <form onSubmit={handleAddAddress} className="add-address-form">
        <div className="form-group">
          <label htmlFor="newAddress">Tambah Alamat Minter Baru</label>
          <input
            type="text"
            id="newAddress"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <button 
          type="submit" 
          className="add-button"
          disabled={isLoading}
        >
          {isLoading ? 'Memproses...' : 'Tambah Minter'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="authorized-list">
        <h3>Daftar Minter yang Diizinkan</h3>
        {authorizedAddresses.length === 0 ? (
          <p className="no-addresses">Belum ada minter yang ditambahkan</p>
        ) : (
          <ul>
            {authorizedAddresses.map((address) => (
              <li key={address} className="address-item">
                <span>{address}</span>
                <button
                  onClick={() => handleRemoveAddress(address)}
                  className="remove-button"
                  disabled={isLoading}
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AccessManager; 