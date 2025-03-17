import { ethers } from "ethers";
import { useState } from "react";
import EventTicketsABI from "./EventTickets.json"; 

function App() {
  const [account, setAccount] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [price, setPrice] = useState("");
  const [ticketId, setTicketId] = useState(null);
  
  const contractAddress = "0xdbc3e57aa0799F9A39E7CaDE005BB9f6ED3422F2"; 

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
    } else {
      alert("Install Metamask dulu!");
    }
  };

  const mintTicket = async () => {
    if (!account) {
      alert("Connect wallet dulu!");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, EventTicketsABI.abi, signer);

    try {
      const tx = await contract.createTicket(
        account,
        eventName,
        Math.floor(new Date(eventDate).getTime() / 1000),
        ethers.parseEther(price)
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'Transfer');
      const newTicketId = event.args[2];
      setTicketId(newTicketId);
      alert(`Ticket #${newTicketId} berhasil dibuat!`);
    } catch (error) {
      console.error(error);
      alert("Gagal mint tiket: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Web3 Ticketing System</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>Account: {account || "Not connected"}</p>

      <h3>Buat Tiket Baru</h3>
      <input
        type="text"
        placeholder="Nama Acara"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
      />
      <br />
      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />
      <br />
      <input
        type="number"
        placeholder="Harga (ETH)"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <br />
      <button onClick={mintTicket}>Mint Tiket</button>
      {ticketId && <p>Ticket ID: {ticketId}</p>}
    </div>
  );
}

export default App;