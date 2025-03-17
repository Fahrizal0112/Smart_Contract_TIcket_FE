import { useState } from 'react';
import { ethers } from 'ethers';
import './Login.css';

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_PARAMS = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia Test Network',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

const Login = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const switchToSepolia = async () => {
    try {
      // Coba switch ke Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_PARAMS.chainId }],
      });
    } catch (switchError) {
      // Jika network belum ada, tambahkan dulu
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_PARAMS],
          });
        } catch (addError) {
          throw new Error('Gagal menambahkan network Sepolia');
        }
      } else {
        throw switchError;
      }
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!window.ethereum) {
        throw new Error("Metamask tidak terinstall");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Cek network dengan string comparison
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== SEPOLIA_CHAIN_ID.toString()) {
        await switchToSepolia();
        // Re-initialize provider setelah switch network
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      onLogin({ provider, signer, address });
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('user rejected')) {
        setError('Koneksi ditolak oleh user');
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Web3 Ticketing System</h1>
        <p className="login-description">
          Selamat datang! Silakan hubungkan wallet Anda untuk melanjutkan.
        </p>
        
        <button 
          className={`login-button ${isLoading ? 'loading' : ''}`}
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Menghubungkan...' : 'Hubungkan Wallet'}
        </button>

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
