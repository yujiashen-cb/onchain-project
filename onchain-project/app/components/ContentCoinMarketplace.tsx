import { useState, useEffect } from 'react';
import { getCoinsTopVolume24h, getCoinsTopGainers, getCoinsMostValuable, tradeCoin } from '@zoralabs/coins-sdk';
import { Address, createWalletClient, createPublicClient, http, parseEther, Hex } from "viem";
import { base } from "viem/chains";
import { useAccount } from 'wagmi';

interface ContentCoin {
  id: string;
  name: string;
  symbol: string;
  description: string;
  marketCap: string;
  volume24h: string;
  marketCapDelta24h: string;
  creatorAddress: string;
}

interface CoinNode {
  id: string;
  name: string;
  symbol: string | null;
  description: string | null;
  marketCap: string | null;
  volume24h: string | null;
  marketCapDelta24h: string | null;
  creatorAddress: string;
}

interface CoinEdge {
  node: CoinNode;
}

interface ExploreList {
  edges: CoinEdge[];
}

interface ZoraResponse {
  data?: {
    exploreList?: ExploreList;
  };
}

interface DashboardSection {
  title: string;
  coins: ContentCoin[];
  isLoading: boolean;
  error: string | null;
}

const MAX_DESCRIPTION_LENGTH = 100;

export default function ContentCoinMarketplace() {
  const { address } = useAccount();
  const [dashboard, setDashboard] = useState<{
    topVolume: DashboardSection;
    topGainers: DashboardSection;
    mostValuable: DashboardSection;
  }>({
    topVolume: { title: 'Top Volume (24h)', coins: [], isLoading: true, error: null },
    topGainers: { title: 'Top Gainers (24h)', coins: [], isLoading: true, error: null },
    mostValuable: { title: 'Most Valuable', coins: [], isLoading: true, error: null },
  });

  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const toggleDescription = (coinId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [coinId]: !prev[coinId]
    }));
  };

  const publicClient = createPublicClient({
    chain: base,
    transport: http("<RPC_URL>"),
  });
   
  const walletClient = createWalletClient({
    account: address as Hex,
    chain: base,
    transport: http("<RPC_URL>"),
  });

  const handleBuy = async (coin: ContentCoin) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      await tradeCoin(
        {
          direction: "buy",
          target: address,
          args: {
            recipient: address,
            orderSize: BigInt("1000000000000000000"), // 1 token in wei
          }
        },
        walletClient,
        publicClient
      );
      alert("Buy successful!");
    } catch (error) {
      const err = error as Error;
      alert("Buy failed: " + err.message);
    }
  };
  
  const handleSell = async (coin: ContentCoin) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      await tradeCoin(
        {
          direction: "sell",
          target: address,
          args: {
            recipient: address,
            orderSize: BigInt("1000000000000000000"), // 1 token in wei
          }
        },
        walletClient,
        publicClient
      );
      alert("Sell successful!");
    } catch (error) {
      const err = error as Error;
      alert("Sell failed: " + err.message);
    }
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch top volume coins
        const volumeResponse = await getCoinsTopVolume24h({ count: 5 }) as ZoraResponse;
        if (volumeResponse.data?.exploreList?.edges) {
          const volumeCoins = volumeResponse.data.exploreList.edges.map((edge) => ({
            id: edge.node.id,
            name: edge.node.name,
            symbol: edge.node.symbol || 'N/A',
            description: edge.node.description || 'No description available',
            marketCap: edge.node.marketCap || '0',
            volume24h: edge.node.volume24h || '0',
            marketCapDelta24h: edge.node.marketCapDelta24h || '0',
            creatorAddress: edge.node.creatorAddress,
          }));
          setDashboard(prev => ({
            ...prev,
            topVolume: { ...prev.topVolume, coins: volumeCoins, isLoading: false }
          }));
        }

        // Fetch top gainers
        const gainersResponse = await getCoinsTopGainers({ count: 5 }) as ZoraResponse;
        if (gainersResponse.data?.exploreList?.edges) {
          const gainerCoins = gainersResponse.data.exploreList.edges.map((edge) => ({
            id: edge.node.id,
            name: edge.node.name,
            symbol: edge.node.symbol || 'N/A',
            description: edge.node.description || 'No description available',
            marketCap: edge.node.marketCap || '0',
            volume24h: edge.node.volume24h || '0',
            marketCapDelta24h: edge.node.marketCapDelta24h || '0',
            creatorAddress: edge.node.creatorAddress,
          }));
          setDashboard(prev => ({
            ...prev,
            topGainers: { ...prev.topGainers, coins: gainerCoins, isLoading: false }
          }));
        }

        // Fetch most valuable coins
        const valuableResponse = await getCoinsMostValuable({ count: 5 }) as ZoraResponse;
        if (valuableResponse.data?.exploreList?.edges) {
          const valuableCoins = valuableResponse.data.exploreList.edges.map((edge) => ({
            id: edge.node.id,
            name: edge.node.name,
            symbol: edge.node.symbol || 'N/A',
            description: edge.node.description || 'No description available',
            marketCap: edge.node.marketCap || '0',
            volume24h: edge.node.volume24h || '0',
            marketCapDelta24h: edge.node.marketCapDelta24h || '0',
            creatorAddress: edge.node.creatorAddress,
          }));
          setDashboard(prev => ({
            ...prev,
            mostValuable: { ...prev.mostValuable, coins: valuableCoins, isLoading: false }
          }));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coins';
        setDashboard(prev => ({
          topVolume: { ...prev.topVolume, error: errorMessage, isLoading: false },
          topGainers: { ...prev.topGainers, error: errorMessage, isLoading: false },
          mostValuable: { ...prev.mostValuable, error: errorMessage, isLoading: false },
        }));
      }
    }

    fetchDashboardData();
  }, []);

  const renderCoinCard = (coin: ContentCoin) => {
    const isExpanded = expandedDescriptions[coin.id];
    const shouldTruncate = coin.description.length > MAX_DESCRIPTION_LENGTH;
    const displayDescription = isExpanded 
      ? coin.description 
      : shouldTruncate 
        ? `${coin.description.substring(0, MAX_DESCRIPTION_LENGTH)}...` 
        : coin.description;

    return (
      <div key={coin.id} className="border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">{coin.name}</h2>
          <a 
            href={`https://zora.co/coins/${coin.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            {coin.symbol}
          </a>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {displayDescription}
          {shouldTruncate && (
            <button
              onClick={() => toggleDescription(coin.id)}
              className="ml-1 text-blue-500 hover:text-blue-700"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Market Cap</span>
            <span className="font-bold">{coin.marketCap} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">24h Volume</span>
            <span className="font-bold">{coin.volume24h} ETH</span>
          </div>
          {coin.marketCapDelta24h !== '0' && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">24h Change</span>
              <span className={`font-bold ${parseFloat(coin.marketCapDelta24h) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {coin.marketCapDelta24h}%
              </span>
            </div>
          )}
        </div>
        <div className="flex mt-auto pt-4 gap-2">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-l hover:bg-green-600 flex-1"
            onClick={() => handleBuy(coin)}
          >
            Buy
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-r hover:bg-red-600 flex-1"
            onClick={() => handleSell(coin)}
          >
            Sell
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (section: DashboardSection) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
      {section.isLoading ? (
        <div className="text-center">Loading...</div>
      ) : section.error ? (
        <div className="text-center text-red-500">{section.error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {section.coins.map(renderCoinCard)}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {renderSection(dashboard.topVolume)}
      {renderSection(dashboard.topGainers)}
      {renderSection(dashboard.mostValuable)}
    </div>
  );
} 