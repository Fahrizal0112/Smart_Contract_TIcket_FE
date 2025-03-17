import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111n;

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("Metamask tidak terinstall");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    
    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      throw new Error("Harap hubungkan ke jaringan Sepolia");
    }

    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { provider, signer, address };
  } catch (error) {
    throw error;
  }
};
