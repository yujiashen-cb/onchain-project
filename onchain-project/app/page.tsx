'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

// Mock data for contentcoins - we'll replace this with real data later
const mockContentCoins = [
  {
    id: 1,
    title: "Crypto Art Masterpiece",
    description: "A unique digital artwork tokenized as a contentcoin",
    price: "0.1 ETH",
    image: "https://picsum.photos/200/200",
  },
  {
    id: 2,
    title: "Web3 Tutorial Series",
    description: "Comprehensive guide to building on blockchain",
    price: "0.05 ETH",
    image: "https://picsum.photos/200/201",
  },
  {
    id: 3,
    title: "NFT Collection Analysis",
    description: "In-depth analysis of trending NFT collections",
    price: "0.15 ETH",
    image: "https://picsum.photos/200/202",
  },
];

export default function App() {
  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
      <header className="pt-4 pr-4">
        <div className="flex justify-end">
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      <main className="flex-grow p-8">
        <h1 className="text-4xl font-bold text-center mb-8">ContentCoins Marketplace</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockContentCoins.map((coin) => (
            <div key={coin.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <img src={coin.image} alt={coin.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{coin.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{coin.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">{coin.price}</span>
                  <div className="space-x-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Buy
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
