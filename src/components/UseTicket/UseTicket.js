import { useState } from 'react';
import { ethers } from 'ethers';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './UseTicket.css';

const UseTicket = ({ provider, signer }) => {
  const [ticketId, setTicketId] = useState('');
  const [ticketDetails, setTicketDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getTicketDetails = async (id) => {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );

      const ticket = await contract.getTicket(id);
      setTicketDetails({
        eventName: ticket.eventName,
        eventDate: new Date(Number(ticket.eventDate) * 1000).toLocaleString(),
        isUsed: ticket.isUsed,
        price: ethers.formatEther(ticket.price.toString())
      });
      setError('');
    } catch (err) {
      setTicketDetails(null);
      setError('Tiket tidak ditemukan');
    }
  };

  const handleCheckTicket = async (e) => {
    e.preventDefault();
    if (!ticketId) return;
    
    setIsLoading(true);
    await getTicketDetails(ticketId);
    setIsLoading(false);
  };

  const handleUseTicket = async () => {
    if (!ticketId || !ticketDetails) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        signer
      );

      const tx = await contract.useTicket(ticketId);
      await tx.wait();

      setSuccess(`Tiket #${ticketId} berhasil digunakan!`);
      await getTicketDetails(ticketId); // Refresh ticket details
    } catch (err) {
      if (err.reason === "Ticket already used") {
        setError("Tiket sudah pernah digunakan!");
      } else if (err.reason?.includes("owner")) {
        setError("Anda bukan pemilik tiket ini!");
      } else {
        setError("Gagal menggunakan tiket. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="use-ticket-container">
      <h2>Gunakan Tiket</h2>

      <form onSubmit={handleCheckTicket} className="use-ticket-form">
        <div className="form-group">
          <label htmlFor="ticketId">Nomor Tiket</label>
          <input
            type="number"
            id="ticketId"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Masukkan ID tiket"
            required
          />
        </div>

        <button 
          type="submit" 
          className="use-ticket-button"
          disabled={isLoading}
        >
          {isLoading ? 'Mencari...' : 'Cek Tiket'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {ticketDetails && (
        <div className="ticket-details">
          <h3>Detail Tiket #{ticketId}</h3>
          <div className="ticket-info">
            <p>
              <span>Nama Acara:</span>
              <span>{ticketDetails.eventName}</span>
            </p>
            <p>
              <span>Tanggal:</span>
              <span>{ticketDetails.eventDate}</span>
            </p>
            <p>
              <span>Harga:</span>
              <span>{ticketDetails.price} ETH</span>
            </p>
            <p>
              <span>Status:</span>
              <span className={`ticket-status ${ticketDetails.isUsed ? 'status-used' : 'status-active'}`}>
                {ticketDetails.isUsed ? 'Sudah Digunakan' : 'Aktif'}
              </span>
            </p>
          </div>

          {!ticketDetails.isUsed && (
            <button 
              onClick={handleUseTicket}
              className="use-ticket-button"
              disabled={isLoading}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {isLoading ? 'Memproses...' : 'Gunakan Tiket'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UseTicket; 