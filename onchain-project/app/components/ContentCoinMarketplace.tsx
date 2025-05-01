import { useState, useEffect } from 'react';
import { getCoinsTopVolume24h, getCoinsTopGainers, getCoinsMostValuable, tradeCoin, getCoinsNew } from '@zoralabs/coins-sdk';
import { Address, createWalletClient, createPublicClient, http, parseEther, Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useSwitchChain } from 'wagmi';

interface ContentCoin {
  id: string;
  name: string;
  symbol: string;
  marketCap: string;
  volume24h: string;
  marketCapDelta24h: string;
  creatorAddress: string;
  contractAddress: string;
}

interface CoinNode {
  id: string;
  name: string;
  symbol: string | null;
  marketCap: string | null;
  volume24h: string | null;
  marketCapDelta24h: string | null;
  creatorAddress: string;
  contractAddress: string;
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
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [dashboard, setDashboard] = useState<{
    topVolume: DashboardSection;
    topGainers: DashboardSection;
    mostValuable: DashboardSection;
    recentCoins: DashboardSection;
  }>({
    topVolume: { title: 'Top Volume (24h)', coins: [], isLoading: true, error: null },
    topGainers: { title: 'Top Gainers (24h)', coins: [], isLoading: true, error: null },
    mostValuable: { title: 'Most Valuable', coins: [], isLoading: true, error: null },
    recentCoins: { title: 'Recent Coins', coins: [], isLoading: true, error: null },
  });

  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const toggleDescription = (coinId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [coinId]: !prev[coinId]
    }));
  };

  useEffect(() => {
    console.log('Connected wallet address:', address);
    console.log('Current chain ID:', chainId);
    console.log('Base Sepolia chain ID:', baseSepolia.id);
    console.log('Network:', chainId === baseSepolia.id ? 'Base Sepolia' : 'Unknown');
    if (chainId) {
      console.log('Network name:', baseSepolia.name);
      console.log('Network RPC URL:', "https://sepolia.base.org");
    }
  }, [address, chainId]);

  const publicClient = address ? createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  }) : null;
   
  const walletClient = address ? createWalletClient({
    account: address as Hex,
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  }) : null;

  const handleNetworkSwitch = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert('Failed to switch to Base Sepolia network. Please switch manually in your wallet.');
    }
  };

  const handleBuy = async (coin: ContentCoin) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (chainId !== baseSepolia.id) {
      handleNetworkSwitch();
      return;
    }

    if (!publicClient || !walletClient) {
      alert("Wallet client not initialized. Please try reconnecting your wallet.");
      return;
    }

    try {
      console.log('Full coin object:', coin);
      console.log('Contract address from coin:', coin.contractAddress);
      console.log('Coin ID:', coin.id);
      
      // Extract contract address from the base64 encoded ID
      const decodedId = atob(coin.id);
      console.log('Decoded ID:', decodedId);
      
      // The ID format is: GraphQLZora20Token:BASE-MAINNET.0x{contractAddress}
      const contractAddress = decodedId.split('.')[1]?.toLowerCase();
      console.log('Extracted contract address:', contractAddress);
      
      if (!contractAddress) {
        throw new Error('Could not extract contract address from coin ID');
      }

      console.log('Checking balance for address:', address);
      console.log('Current chain ID:', chainId);
      console.log('Base Sepolia chain ID:', baseSepolia.id);
      
      const balance = await publicClient.getBalance({ address });
      console.log('Raw balance in wei:', balance.toString());
      console.log('Balance in ETH:', Number(balance) / 1e18);
      
      const tradeAmount = BigInt("1");
      console.log('Trade amount in wei:', tradeAmount.toString());
      console.log('Trade amount in ETH:', Number(tradeAmount) / 1e18);
      
      if (balance < tradeAmount) {
        throw new Error(`Insufficient balance. Current balance: ${Number(balance) / 1e18} ETH, Required: ${Number(tradeAmount) / 1e18} ETH`);
      }

      console.log('Attempting to buy with contract address:', contractAddress);
      const result = await tradeCoin(
        {
          direction: "buy",
          target: contractAddress as `0x${string}`,
          args: {
            recipient: address,
            orderSize: tradeAmount,
            minAmountOut: BigInt(0),
            tradeReferrer: "0x0000000000000000000000000000000000000000" as `0x${string}`
          }
        },
        walletClient,
        publicClient
      );
      
      console.log('Trade result:', result);
      alert("Buy successful!");
    } catch (error) {
      console.error('Trade error:', error);
      const err = error as Error;
      alert(err.message);
    }
  };
  
  const handleSell = async (coin: ContentCoin) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (chainId !== baseSepolia.id) {
      handleNetworkSwitch();
      return;
    }

    if (!publicClient || !walletClient) {
      alert("Wallet client not initialized. Please try reconnecting your wallet.");
      return;
    }

    try {
      console.log('Checking balance for address:', address);
      console.log('Current chain ID:', chainId);
      console.log('Base Sepolia chain ID:', baseSepolia.id);
      
      const balance = await publicClient.getBalance({ address });
      console.log('Raw balance in wei:', balance.toString());
      console.log('Balance in ETH:', Number(balance) / 1e18);
      
      const tradeAmount = BigInt("1");
      console.log('Trade amount in wei:', tradeAmount.toString());
      console.log('Trade amount in ETH:', Number(tradeAmount) / 1e18);
      
      if (balance < tradeAmount) {
        throw new Error(`Insufficient balance. Current balance: ${Number(balance) / 1e18} ETH, Required: ${Number(tradeAmount) / 1e18} ETH`);
      }

      console.log('Attempting to sell with contract address:', coin.contractAddress);
      const result = await tradeCoin(
        {
          direction: "sell",
          target: coin.contractAddress as `0x${string}`,
          args: {
            recipient: address,
            orderSize: tradeAmount,
            minAmountOut: BigInt(0),
            tradeReferrer: "0x0000000000000000000000000000000000000000" as `0x${string}`
          }
        },
        walletClient,
        publicClient
      );
      
      console.log('Trade result:', result);
      alert("Sell successful!");
    } catch (error) {
      console.error('Trade error:', error);
      const err = error as Error;
      alert(err.message);
    }
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch recent coins
        const recentResponse = await getCoinsNew({ count: 5 }) as ZoraResponse;
        console.log('Recent coins response:', recentResponse);
        if (recentResponse.data?.exploreList?.edges) {
          const recentCoins = recentResponse.data.exploreList.edges.map((edge) => {
            console.log('Processing coin:', edge.node);
            return {
              id: edge.node.id,
              name: edge.node.name,
              symbol: edge.node.symbol || 'N/A',
              marketCap: edge.node.marketCap || '0',
              volume24h: edge.node.volume24h || '0',
              marketCapDelta24h: edge.node.marketCapDelta24h || '0',
              creatorAddress: edge.node.creatorAddress,
              contractAddress: edge.node.id.split(':')[1] || edge.node.contractAddress, // Fallback to contractAddress if split fails
            };
          });
          console.log('Processed recent coins:', recentCoins);
          setDashboard(prev => ({
            ...prev,
            recentCoins: { ...prev.recentCoins, coins: recentCoins, isLoading: false }
          }));
        }

        // Fetch top volume coins
        const volumeResponse = await getCoinsTopVolume24h({ count: 5 }) as ZoraResponse;
        console.log('Volume coins response:', volumeResponse);
        if (volumeResponse.data?.exploreList?.edges) {
          const volumeCoins = volumeResponse.data.exploreList.edges.map((edge) => {
            console.log('Processing volume coin:', edge.node);
            return {
              id: edge.node.id,
              name: edge.node.name,
              symbol: edge.node.symbol || 'N/A',
              marketCap: edge.node.marketCap || '0',
              volume24h: edge.node.volume24h || '0',
              marketCapDelta24h: edge.node.marketCapDelta24h || '0',
              creatorAddress: edge.node.creatorAddress,
              contractAddress: edge.node.id.split(':')[1] || edge.node.contractAddress,
            };
          });
          console.log('Processed volume coins:', volumeCoins);
          setDashboard(prev => ({
            ...prev,
            topVolume: { ...prev.topVolume, coins: volumeCoins, isLoading: false }
          }));
        }

        // Fetch top gainers
        const gainersResponse = await getCoinsTopGainers({ count: 5 }) as ZoraResponse;
        console.log('Gainers response:', gainersResponse);
        if (gainersResponse.data?.exploreList?.edges) {
          const gainerCoins = gainersResponse.data.exploreList.edges.map((edge) => {
            console.log('Processing gainer coin:', edge.node);
            return {
              id: edge.node.id,
              name: edge.node.name,
              symbol: edge.node.symbol || 'N/A',
              marketCap: edge.node.marketCap || '0',
              volume24h: edge.node.volume24h || '0',
              marketCapDelta24h: edge.node.marketCapDelta24h || '0',
              creatorAddress: edge.node.creatorAddress,
              contractAddress: edge.node.id.split(':')[1] || edge.node.contractAddress,
            };
          });
          console.log('Processed gainer coins:', gainerCoins);
          setDashboard(prev => ({
            ...prev,
            topGainers: { ...prev.topGainers, coins: gainerCoins, isLoading: false }
          }));
        }

        // Fetch most valuable coins
        const valuableResponse = await getCoinsMostValuable({ count: 5 }) as ZoraResponse;
        console.log('Valuable coins response:', valuableResponse);
        if (valuableResponse.data?.exploreList?.edges) {
          const valuableCoins = valuableResponse.data.exploreList.edges.map((edge) => {
            console.log('Processing valuable coin:', edge.node);
            return {
              id: edge.node.id,
              name: edge.node.name,
              symbol: edge.node.symbol || 'N/A',
              marketCap: edge.node.marketCap || '0',
              volume24h: edge.node.volume24h || '0',
              marketCapDelta24h: edge.node.marketCapDelta24h || '0',
              creatorAddress: edge.node.creatorAddress,
              contractAddress: edge.node.id.split(':')[1] || edge.node.contractAddress,
            };
          });
          console.log('Processed valuable coins:', valuableCoins);
          setDashboard(prev => ({
            ...prev,
            mostValuable: { ...prev.mostValuable, coins: valuableCoins, isLoading: false }
          }));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);x
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coins';
        setDashboard(prev => ({
          ...prev,
          topVolume: { ...prev.topVolume, error: errorMessage, isLoading: false },
          topGainers: { ...prev.topGainers, error: errorMessage, isLoading: false },
          mostValuable: { ...prev.mostValuable, error: errorMessage, isLoading: false },
          recentCoins: { ...prev.recentCoins, error: errorMessage, isLoading: false },
        }));
      }
    }

    fetchDashboardData();
  }, []);

  const renderCoinCard = (coin: ContentCoin) => {
    return (
      <div key={coin.id} className="border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
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
                {Math.round(parseFloat(coin.marketCapDelta24h))}%
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
      {renderSection(dashboard.recentCoins)}
      {renderSection(dashboard.topVolume)}
      {renderSection(dashboard.topGainers)}
      {renderSection(dashboard.mostValuable)}
    </div>
  );
} 