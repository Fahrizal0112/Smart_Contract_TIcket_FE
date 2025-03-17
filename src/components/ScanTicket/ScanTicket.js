import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ethers } from 'ethers';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './ScanTicket.css';

const ScanTicket = ({ provider, signer }) => {
  const [isMinter, setIsMinter] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    checkMinterRole();
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [signer]);

  const checkMinterRole = async () => {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );
      const address = await signer.getAddress();
      const hasRole = await contract.isMinter(address);
      setIsMinter(hasRole);
    } catch (err) {
      console.error("Error checking minter role:", err);
      setError("Gagal memeriksa akses");
    }
  };

  const startScanner = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader", 
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      }
    );

    html5QrcodeScanner.render(handleScan, handleError);
    setScanner(html5QrcodeScanner);
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const handleScan = async (decodedText) => {
    try {
      const ticketData = JSON.parse(decodedText);
      stopScanner();
      setScanResult(ticketData);
      await validateAndUseTicket(ticketData);
    } catch (err) {
      console.error("QR Scan error:", err);
      setError("Format QR code tidak valid");
    }
  };

  const handleError = (err) => {
    console.error("QR Scanner error:", err);
  };

  const validateAndUseTicket = async (ticketData) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        signer
      );

      const ticket = await contract.getTicket(ticketData.ticketId);
      
      if (ticket.isUsed) {
        setError("Tiket sudah pernah digunakan!");
        return;
      }

      const tx = await contract.useTicket(ticketData.ticketId);
      await tx.wait();

      setSuccess(`Tiket #${ticketData.ticketId} berhasil divalidasi dan digunakan!`);
      
      setScanResult({
        ...ticketData,
        status: 'Berhasil Digunakan',
        timestamp: new Date().toLocaleString('id-ID')
      });

    } catch (err) {
      console.error("Error using ticket:", err);
      setError(err.message || "Gagal menggunakan tiket");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMinter) {
    return (
      <div className="scan-ticket-container">
        <div className="access-denied">
          <h2>Akses Terbatas</h2>
          <p>Maaf, Anda tidak memiliki akses untuk memvalidasi tiket.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scan-ticket-container">
      <h2>Scan Tiket</h2>
      
      {!isScanning && !scanResult && (
        <button 
          className="start-scan-button"
          onClick={startScanner}
        >
          Mulai Scan
        </button>
      )}

      <div id="qr-reader" className="scanner-container"></div>

      {isScanning && (
        <button 
          className="cancel-scan-button"
          onClick={stopScanner}
        >
          Batal
        </button>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {scanResult && (
        <div className="scan-result">
          <h3>Hasil Scan</h3>
          <div className="ticket-info">
            <p><strong>ID Tiket:</strong> #{scanResult.ticketId}</p>
            <p><strong>Event:</strong> {scanResult.eventName}</p>
            <p><strong>Tanggal Event:</strong> {new Date(scanResult.eventDate).toLocaleString('id-ID')}</p>
            {scanResult.status && (
              <>
                <p><strong>Status:</strong> {scanResult.status}</p>
                <p><strong>Waktu Scan:</strong> {scanResult.timestamp}</p>
              </>
            )}
          </div>
          <button 
            className="new-scan-button"
            onClick={() => {
              setScanResult(null);
              setSuccess('');
              setError('');
              startScanner();
            }}
          >
            Scan Tiket Baru
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Memproses tiket...</p>
        </div>
      )}
    </div>
  );
};

export default ScanTicket; 