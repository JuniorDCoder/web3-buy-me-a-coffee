import { createWalletClient, custom, createPublicClient, parseEther, defineChain, formatEther } from 'https://esm.sh/viem'
import { abi, contractAddress } from './constants-js.js';

const connectButton = document.getElementById('connectButton');
const fundButton = document.getElementById('fundButton');
const ethAmountInput = document.getElementById('ethAmount');
const balanceButton = document.getElementById('balanceButton');
const withdrawButton = document.getElementById('withdrawButton');
const statusMessage = document.getElementById('statusMessage');

let walletClient
let publicClient

// Update stats with random values for demo
document.getElementById('totalDonations').textContent = (24.5 + Math.random() * 2).toFixed(1);
document.getElementById('coffeeCount').textContent = 128 + Math.floor(Math.random() * 10);
document.getElementById('supporters').textContent = 89 + Math.floor(Math.random() * 5);

// Show status message
function showStatus(message, isSuccess = true) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isSuccess ? 'status-success' : 'status-error'}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}

async function connect() {
    if(typeof window.ethereum !== 'undefined') {
        try {
            showStatus('Connecting to wallet...', true);
            walletClient = createWalletClient({
                transport: custom(window.ethereum),
            })
            await walletClient.requestAddresses()
            connectButton.innerHTML = '<i class="fas fa-check"></i> Connected';
            connectButton.disabled = true;
            showStatus('Wallet connected successfully!', true);
        } catch (error) {
            console.error('Connection error:', error);
            showStatus('Failed to connect wallet', false);
        }
    } else{
        connectButton.innerHTML = 'Please install MetaMask!';
        showStatus('MetaMask not detected. Please install MetaMask.', false);
    }
}

async function fund() {
    const ethAmount = ethAmountInput.value
    
    if (!ethAmount || isNaN(ethAmount) || parseFloat(ethAmount) <= 0) {
        showStatus('Please enter a valid ETH amount', false);
        return;
    }

    console.log(`Funding with ${parseEther(ethAmount)} ETH...`)

    if(typeof window.ethereum !== 'undefined') {
        try {
            showStatus(`Processing donation of ${ethAmount} ETH...`, true);
            
            walletClient = createWalletClient({
                transport: custom(window.ethereum),
            })
            const [ connectedAccount ] = await walletClient.requestAddresses()
            const currentChain = await getCurrentChain(walletClient)

            publicClient = createPublicClient({
                transport: custom(window.ethereum),
            })

            const { request } =  await publicClient.simulateContract({
                address: contractAddress,
                abi: abi,
                functionName: 'fund',
                account: connectedAccount,
                chain: currentChain,
                value: parseEther(ethAmount),
            })

            const hash = await walletClient.writeContract(request)
            console.log(`Transaction hash: ${hash}`)
            
            showStatus(`Successfully donated ${ethAmount} ETH! Thank you for the coffee! ☕`, true);
            ethAmountInput.value = '';
            
            // Update stats
            const currentDonations = parseFloat(document.getElementById('totalDonations').textContent);
            document.getElementById('totalDonations').textContent = (currentDonations + parseFloat(ethAmount)).toFixed(1);
            
            const currentCoffees = parseInt(document.getElementById('coffeeCount').textContent);
            document.getElementById('coffeeCount').textContent = currentCoffees + 1;
            
        } catch (error) {
            console.error('Funding error:', error);
            showStatus('Transaction failed. Please try again.', false);
        }
    } else{
        connectButton.innerHTML = 'Please install MetaMask!';
        showStatus('MetaMask not detected.', false);
    }
}

async function getCurrentChain(client) {
  const chainId = await client.getChainId()
  const currentChain = defineChain({
    id: chainId,
    name: "Custom Chain",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["http://localhost:8545"],
      },
    },
  })
  return currentChain
}

async function getBalance() {
    if(typeof window.ethereum !== 'undefined') {
        try {
            showStatus('Fetching balance...', true);
            
            publicClient = createPublicClient({
                transport: custom(window.ethereum),
            })
            const balance = await publicClient.getBalance({
                address: contractAddress,
            })
            const formattedBalance = formatEther(balance);
            console.log(`Contract balance: ${formattedBalance} ETH`)
            showStatus(`Contract balance: ${formattedBalance} ETH`, true);
        } catch (error) {
            console.error('Balance check error:', error);
            showStatus('Failed to fetch balance', false);
        }
    } else {
        showStatus('MetaMask not detected.', false);
    }
}

async function withdraw() {
    console.log(`Withdrawing funds...`)

    if(typeof window.ethereum !== 'undefined') {
        try {
            showStatus('Processing withdrawal...', true);
            
            walletClient = createWalletClient({
                transport: custom(window.ethereum),
            })
            const [ connectedAccount ] = await walletClient.requestAddresses()
            const currentChain = await getCurrentChain(walletClient)

            publicClient = createPublicClient({
                transport: custom(window.ethereum),
            })

            const { request } =  await publicClient.simulateContract({
                address: contractAddress,
                abi: abi,
                functionName: 'withdraw',
                account: connectedAccount,
                chain: currentChain,
                // No value parameter since we're not sending ETH
            })

            const hash = await walletClient.writeContract(request)
            console.log(`Withdrawal transaction hash: ${hash}`)
            showStatus('Withdrawal completed successfully!', true);
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            showStatus('Withdrawal failed. Please try again.', false);
        }
    } else{
        connectButton.innerHTML = 'Please install MetaMask!';
        showStatus('MetaMask not detected.', false);
    }
}

// Event listeners
connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw