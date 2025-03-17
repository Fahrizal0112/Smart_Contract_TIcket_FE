import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './CreateTicket.css';

const CreateTicket = ({ provider, signer }) => {
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    price: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkOwner();
  }, [signer]);

  const checkOwner = async () => {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );
      
      console.log("Checking minter status...");
      const currentAddress = await signer.getAddress();
      
      const isMinter = await contract.isMinter(currentAddress);
      console.log("Is minter?", isMinter);
      
      setIsOwner(isMinter);
    } catch (err) {
      console.error("Error checking minter status:", err);
      setError(`Gagal memeriksa status minter: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOwner) {
      setError("Hanya minter yang dapat membuat tiket!");
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

      const tx = await contract.createTicket(
        await signer.getAddress(),
        formData.eventName,
        Math.floor(new Date(formData.eventDate).getTime() / 1000),
        ethers.parseEther(formData.price)
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'Transfer'
      );
      const newTicketId = event.args[2];

      setSuccess(`Tiket #${newTicketId} berhasil dibuat!`);
      setFormData({ eventName: '', eventDate: '', price: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="create-ticket-container">
        <div className="not-owner-message">
          <h2>Akses Terbatas</h2>
          <p>Maaf, hanya minter yang dapat membuat tiket baru.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-ticket-container">
      <h2>Buat Tiket Baru</h2>
      
      <form onSubmit={handleSubmit} className="create-ticket-form">
        <div className="form-group">
          <label htmlFor="eventName">Nama Acara</label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            required
            placeholder="Masukkan nama acara"
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDate">Tanggal Acara</label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Harga (ETH)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>

        <button 
          type="submit" 
          className={`create-ticket-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Membuat Tiket...' : 'Buat Tiket'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Sedang membuat tiket...</p>
            <p className="loading-subtitle">Mohon tunggu dan jangan tutup halaman ini</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTicket; 