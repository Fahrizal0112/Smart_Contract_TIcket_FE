import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login/Login";
import Navbar from "./components/Navbar/Navbar";
import CreateTicket from "./components/CreateTicket/CreateTicket";
import UseTicket from "./components/UseTicket/UseTicket";
import AccessManager from './components/AccessManager/AccessManager';
import TransferTicket from './components/TransferTicket/TransferTicket';
import MyTickets from './components/MyTickets/MyTickets';
import ScanTicket from './components/ScanTicket/ScanTicket';
import BuyTicket from './components/BuyTicket/BuyTicket';
import './App.css';

function App() {
  const [walletData, setWalletData] = useState(null);

  const handleLogin = (data) => {
    setWalletData(data);
  };

  if (!walletData) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar address={walletData.address} />
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route 
              path="/create" 
              element={
                <CreateTicket 
                  provider={walletData.provider} 
                  signer={walletData.signer} 
                />
              } 
            />
            <Route 
              path="/use" 
              element={
                <UseTicket 
                  provider={walletData.provider} 
                  signer={walletData.signer} 
                />
              } 
            />
            <Route 
              path="/access" 
              element={
                <AccessManager 
                  provider={walletData.provider} 
                  signer={walletData.signer} 
                />
              } 
            />
            <Route 
              path="/transfer" 
              element={
                <TransferTicket 
                  provider={walletData.provider} 
                  signer={walletData.signer} 
                />
              } 
            />
            <Route 
              path="/my-tickets" 
              element={
                <MyTickets 
                  provider={walletData.provider} 
                  signer={walletData.signer} 
                />
              } 
            />
            <Route 
              path="/scan" 
              element={
                <ScanTicket 
                  provider={walletData.provider} 
                  signer={walletData.signer} 
                />
              } 
            />
            <Route 
              path="/buy" 
              element={
                <BuyTicket 
                  provider={walletData.provider} 
                  signer={walletData.signer} 
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;