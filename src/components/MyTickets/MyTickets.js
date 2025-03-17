import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './MyTickets.css';

const MyTickets = ({ provider, signer }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [success, setSuccess] = useState('');
  const [isSellingTicket, setIsSellingTicket] = useState(false);
  const [sellingTicketId, setSellingTicketId] = useState(null);

  useEffect(() => {
    loadMyTickets();
  }, [signer]);

  const loadMyTickets = async () => {
    try {
      setIsLoading(true);
      setError('');

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );

      const address = await signer.getAddress();
      console.log('Current address:', address);

      // Coba dapatkan event Transfer untuk alamat ini
      const filter = contract.filters.Transfer(null, address, null);
      const events = await contract.queryFilter(filter);
      console.log('Transfer events:', events);

      const uniqueTokenIds = [...new Set(events.map(event => event.args[2]))];
      console.log('Unique token IDs:', uniqueTokenIds);

      const ticketPromises = uniqueTokenIds.map(async (tokenId) => {
        try {
          const owner = await contract.ownerOf(tokenId);
          // Hanya ambil tiket jika user masih pemiliknya
          if (owner.toLowerCase() === address.toLowerCase()) {
            const ticket = await contract.getTicket(tokenId);
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
          console.log('Error checking ticket:', tokenId, err);
          return null;
        }
      });

      const ticketDetails = (await Promise.all(ticketPromises))
        .filter(ticket => ticket !== null)
        .sort((a, b) => b.eventDate - a.eventDate);

      console.log('Final ticket details:', ticketDetails);
      
      setTickets(ticketDetails);
      setError('');
    } catch (err) {
      console.error('Detailed error:', err);
      setError('Gagal memuat tiket: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferClick = (ticketId) => {
    navigate(`/transfer?ticketId=${ticketId}`);
  };

  const handleShowQR = (ticket) => {
    setSelectedTicket(ticket);
    setShowQR(true);
  };

  const handleSellTicket = async (ticketId) => {
    try {
      setIsSellingTicket(true);
      setSellingTicketId(ticketId);
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        signer
      );

      const tx = await contract.sellTicket(ticketId);
      await tx.wait();

      setSuccess(`Tiket #${ticketId} berhasil dijual!`);
      loadMyTickets();
      
      setTimeout(() => {
        navigate('/buy');
      }, 2000);
    } catch (err) {
      console.error("Error selling ticket:", err);
      setError(err.message || "Gagal menjual tiket");
    } finally {
      setIsSellingTicket(false);
      setSellingTicketId(null);
    }
  };

  const QRModal = ({ ticket, onClose }) => {
    // Generate data untuk QR code
    const qrData = JSON.stringify({
      ticketId: ticket.id,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      contractAddress: CONTRACT_ADDRESS
    });

    return (
      <div className="qr-modal-overlay" onClick={onClose}>
        <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>&times;</button>
          <h3>QR Code Tiket #{ticket.id}</h3>
          <div className="qr-container">
            <QRCodeSVG 
              value={qrData}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="ticket-info-qr">
            <p><strong>Event:</strong> {ticket.eventName}</p>
            <p><strong>Tanggal:</strong> {ticket.eventDate.toLocaleString('id-ID', {
              dateStyle: 'long',
              timeStyle: 'short'
            })}</p>
          </div>
          <button className="download-button" onClick={() => {
            const svg = document.querySelector('.qr-container svg');
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const pngFile = canvas.toDataURL('image/png');
              const downloadLink = document.createElement('a');
              downloadLink.download = `ticket-${ticket.id}-qr.png`;
              downloadLink.href = pngFile;
              downloadLink.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
          }}>
            Download QR
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="my-tickets-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat tiket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-tickets-container">
      <h2>Tiket Saya</h2>
      <button onClick={loadMyTickets} className="refresh-button">
        <span className="refresh-icon">↻</span> Refresh
      </button>

      {error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadMyTickets} className="retry-button">
            Coba Lagi
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="no-tickets">
          <p>Anda belum memiliki tiket</p>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <span className={`ticket-status ${ticket.isUsed ? 'status-used' : 'status-active'}`}>
                  {ticket.isUsed ? 'Sudah Digunakan' : 'Aktif'}
                </span>
                <span className="ticket-id">No Ticket :#{ticket.id}</span>
              </div>

              <div className="ticket-body">
                <h3>{ticket.eventName}</h3>
                <p className="ticket-date">
                  {ticket.eventDate.toLocaleString('id-ID', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </p>
                <p className="ticket-price">{ticket.price} ETH</p>
              </div>

              <div className="ticket-actions">
                {!ticket.isUsed && (
                  <>
                    <button 
                      onClick={() => handleTransferClick(ticket.id)}
                      className="transfer-button"
                    >
                      Transfer
                    </button>
                    <button 
                      onClick={() => handleShowQR(ticket)}
                      className="qr-button"
                    >
                      Generate QR
                    </button>
                    <button 
                      onClick={() => handleSellTicket(ticket.id)}
                      className="sell-button"
                    >
                      Jual Tiket
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showQR && selectedTicket && (
        <QRModal 
          ticket={selectedTicket} 
          onClose={() => {
            setShowQR(false);
            setSelectedTicket(null);
          }}
        />
      )}

      {isSellingTicket && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>Menjual Tiket #{sellingTicketId}</h3>
            <div className="loading-steps">
              <div className="step-item">
                <div className="step-indicator active"></div>
                <p>Menginisiasi penjualan...</p>
              </div>
              <div className="step-item">
                <div className="step-indicator"></div>
                <p>Menunggu konfirmasi blockchain...</p>
              </div>
              <div className="step-item">
                <div className="step-indicator"></div>
                <p>Memfinalisasi penjualan...</p>
              </div>
            </div>
            <div className="loading-warning">
              <i className="warning-icon">⚠️</i>
              <p>Mohon tunggu dan jangan tutup halaman ini</p>
              <p className="warning-subtitle">Proses ini membutuhkan konfirmasi blockchain</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets; 