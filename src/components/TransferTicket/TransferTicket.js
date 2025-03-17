import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './TransferTicket.css';

const TransferTicket = ({ provider, signer }) => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    ticketId: '',
    recipientAddress: ''
  });
  const [ticketDetails, setTicketDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (ticketId) {
      setFormData(prev => ({ ...prev, ticketId }));
      checkTicketDetails(ticketId);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'ticketId' && value) {
      checkTicketDetails(value);
    }
  };

  const checkTicketDetails = async (tokenId) => {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );

      const ticket = await contract.getTicket(tokenId);
      const owner = await contract.ownerOf(tokenId);
      const currentAddress = await signer.getAddress();

      setTicketDetails({
        eventName: ticket.eventName,
        eventDate: new Date(Number(ticket.eventDate) * 1000).toLocaleString(),
        isUsed: ticket.isUsed,
        price: ethers.formatEther(ticket.price.toString()),
        owner,
        isOwner: owner.toLowerCase() === currentAddress.toLowerCase()
      });
      setError('');
    } catch (err) {
      setTicketDetails(null);
      setError('Tiket tidak ditemukan atau Anda tidak memiliki akses');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!formData.ticketId || !formData.recipientAddress) {
      setError('Mohon isi semua field');
      return;
    }

    if (!ethers.isAddress(formData.recipientAddress)) {
      setError('Alamat penerima tidak valid');
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

      // Menggunakan fungsi transferFrom dari ERC721
      const tx = await contract.transferFrom(
        await signer.getAddress(),
        formData.recipientAddress,
        formData.ticketId
      );
      await tx.wait();

      setSuccess(`Tiket #${formData.ticketId} berhasil ditransfer ke ${formData.recipientAddress}`);
      setFormData({ ticketId: '', recipientAddress: '' });
      setTicketDetails(null);
    } catch (err) {
      if (err.message.includes('not owner')) {
        setError('Anda bukan pemilik tiket ini');
      } else if (err.message.includes('already used')) {
        setError('Tiket sudah digunakan');
      } else {
        setError('Gagal mentransfer tiket: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transfer-ticket-container">
      <h2>Transfer Tiket</h2>

      <form onSubmit={handleTransfer} className="transfer-ticket-form">
        <div className="form-group">
          <label htmlFor="ticketId">ID Tiket</label>
          <input
            type="number"
            id="ticketId"
            name="ticketId"
            value={formData.ticketId}
            onChange={handleChange}
            placeholder="Masukkan ID tiket"
            required
          />
        </div>

        {ticketDetails && (
          <div className="ticket-preview">
            <h3>Detail Tiket</h3>
            <div className="ticket-info">
              <p><span>Nama Acara:</span> <span>{ticketDetails.eventName}</span></p>
              <p><span>Tanggal:</span> <span>{ticketDetails.eventDate}</span></p>
              <p><span>Status:</span> 
                <span className={`ticket-status ${ticketDetails.isUsed ? 'status-used' : 'status-active'}`}>
                  {ticketDetails.isUsed ? 'Sudah Digunakan' : 'Aktif'}
                </span>
              </p>
              <p><span>Pemilik:</span> <span className="owner-address">{ticketDetails.owner}</span></p>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="recipientAddress">Alamat Penerima</label>
          <input
            type="text"
            id="recipientAddress"
            name="recipientAddress"
            value={formData.recipientAddress}
            onChange={handleChange}
            placeholder="0x..."
            required
          />
        </div>

        <button 
          type="submit" 
          className={`transfer-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading || !ticketDetails?.isOwner || ticketDetails?.isUsed}
        >
          {isLoading ? 'Memproses...' : 'Transfer Tiket'}
        </button>

        {!ticketDetails?.isOwner && ticketDetails && (
          <p className="warning-message">Anda bukan pemilik tiket ini</p>
        )}

        {ticketDetails?.isUsed && (
          <p className="warning-message">Tiket sudah digunakan</p>
        )}
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>Mentransfer Tiket</h3>
            <div className="loading-steps">
              <p className="step">1. Menginisiasi transfer...</p>
              <p className="step">2. Menunggu konfirmasi blockchain...</p>
              <p className="step">3. Memfinalisasi transfer...</p>
            </div>
            <p className="loading-warning">Mohon jangan tutup halaman ini sampai proses selesai</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferTicket; 