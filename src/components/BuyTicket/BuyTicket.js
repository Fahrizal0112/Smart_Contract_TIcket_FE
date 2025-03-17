import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './BuyTicket.css';

const BuyTicket = ({ provider, signer }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingTicketId, setProcessingTicketId] = useState(null);

  useEffect(() => {
    loadAvailableTickets();
  }, [provider]);

  const loadAvailableTickets = async () => {
    try {
      setIsLoading(true);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );

      // Dapatkan semua event Transfer untuk menemukan tiket yang ada
      const filter = contract.filters.Transfer();
      const events = await contract.queryFilter(filter);
      
      // Proses events untuk mendapatkan unique token IDs
      const uniqueTokenIds = [...new Set(events.map(event => event.args[2]))];
      
      // Dapatkan detail untuk setiap tiket
      const ticketPromises = uniqueTokenIds.map(async (tokenId) => {
        try {
          const ticket = await contract.getTicket(tokenId);
          const owner = await contract.ownerOf(tokenId);
          
          // Filter hanya tiket yang dimiliki oleh contract (belum terjual)
          if (owner.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() && !ticket.isUsed) {
            return {
              id: tokenId.toString(),
              eventName: ticket.eventName,
              eventDate: new Date(Number(ticket.eventDate) * 1000),
              price: ethers.formatEther(ticket.price.toString()),
              isUsed: ticket.isUsed
            };
          }
          return null;
        } catch (err) {
          console.error(`Error fetching ticket ${tokenId}:`, err);
          return null;
        }
      });

      const availableTickets = (await Promise.all(ticketPromises))
        .filter(ticket => ticket !== null)
        .sort((a, b) => a.eventDate - b.eventDate);

      setTickets(availableTickets);
      setError('');
    } catch (err) {
      console.error("Error loading tickets:", err);
      setError('Gagal memuat daftar tiket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyTicket = async (ticketId, price) => {
    try {
      setProcessingTicketId(ticketId);
      setError('');
      setSuccess('');

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        signer
      );

      const tx = await contract.purchaseTicket(ticketId, {
        value: ethers.parseEther(price)
      });

      await tx.wait();

      setSuccess(`Tiket #${ticketId} berhasil dibeli!`);
      loadAvailableTickets();
    } catch (err) {
      console.error("Error buying ticket:", err);
      if (err.message.includes("insufficient funds")) {
        setError("ETH tidak cukup untuk membeli tiket");
      } else {
        setError(err.message || 'Gagal membeli tiket');
      }
    } finally {
      setProcessingTicketId(null);
    }
  };

  return (
    <div className="buy-ticket-container">
      <h2>Beli Tiket</h2>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat daftar tiket...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadAvailableTickets} className="retry-button">
            Coba Lagi
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="no-tickets-message">
          <p>Tidak ada tiket yang tersedia saat ini</p>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <h3>{ticket.eventName}</h3>
                <span className="ticket-id">#{ticket.id}</span>
              </div>
              
              <div className="ticket-details">
                <p className="event-date">
                  <i className="far fa-calendar"></i>
                  {ticket.eventDate.toLocaleString('id-ID', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </p>
                <p className="ticket-price">
                  <i className="fab fa-ethereum"></i>
                  {ticket.price} ETH
                </p>
              </div>

              <button
                className={`buy-button ${processingTicketId === ticket.id ? 'loading' : ''}`}
                onClick={() => handleBuyTicket(ticket.id, ticket.price)}
                disabled={processingTicketId !== null}
              >
                {processingTicketId === ticket.id ? 'Memproses...' : 'Beli Tiket'}
              </button>
            </div>
          ))}
        </div>
      )}

      {success && <div className="success-message">{success}</div>}

      {/* Loading Overlay saat proses pembelian */}
      {processingTicketId && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>Memproses Pembelian</h3>
            <div className="loading-steps">
              <p className="step">1. Menginisiasi transaksi...</p>
              <p className="step">2. Menunggu konfirmasi blockchain...</p>
              <p className="step">3. Memfinalisasi pembelian...</p>
            </div>
            <p className="loading-warning">
              Mohon tunggu dan jangan tutup halaman ini
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyTicket; 