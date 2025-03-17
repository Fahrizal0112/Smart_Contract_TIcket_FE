import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EventTicketsABI from '../../EventTickets.json';
import { CONTRACT_ADDRESS } from '../../utils/constants';
import './WithdrawRevenue.css';

const WithdrawRevenue = ({ provider, signer }) => {
  const [revenue, setRevenue] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    loadRevenue();
  }, [signer]);

  const loadRevenue = async () => {
    try {
      setIsLoading(true);
      setError('');

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        provider
      );

      const address = await signer.getAddress();
      const revenueWei = await contract.revenues(address);
      const revenueEth = ethers.formatEther(revenueWei.toString());

      setRevenue(revenueEth);
    } catch (err) {
      console.error('Error loading revenue:', err);
      setError('Gagal memuat pendapatan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsWithdrawing(true);
      setError('');
      setSuccess('');

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EventTicketsABI.abi,
        signer
      );

      const tx = await contract.withdrawRevenue();
      await tx.wait();

      setSuccess('Penarikan ETH berhasil!');
      setRevenue('0');
      
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError('Gagal melakukan penarikan');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="withdraw-container">
      <h2>Tarik Pendapatan</h2>

      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data pendapatan...</p>
        </div>
      ) : (
        <div className="revenue-card">
          <div className="revenue-info">
            <h3>Pendapatan Tersedia</h3>
            <div className="eth-amount">
              <i className="fab fa-ethereum"></i>
              <span>{revenue} ETH</span>
            </div>
          </div>

          <button
            className="withdraw-button"
            onClick={handleWithdraw}
            disabled={isWithdrawing || Number(revenue) === 0}
          >
            {isWithdrawing ? 'Memproses...' : 'Tarik ETH'}
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isWithdrawing && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>Memproses Penarikan</h3>
            <div className="loading-steps">
              <p className="step">1. Menginisiasi transaksi...</p>
              <p className="step">2. Menunggu konfirmasi blockchain...</p>
              <p className="step">3. Memfinalisasi penarikan...</p>
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

export default WithdrawRevenue; 