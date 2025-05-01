import { useState, useEffect } from 'react';
import { getCoinsTopVolume24h, getCoinsTopGainers, getCoinsMostValuable, tradeCoin, getCoinsNew, createCoin } from '@zoralabs/coins-sdk';
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
  description?: string;
  mediaContent?: {
    mimeType: string;
    originalUri: string;
    previewImage?: {
      uri: string;
    };
  };
  creatorProfile?: {
    handle: string;
    avatar?: {
      uri: string;
    };
  };
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
  description?: string;
  mediaContent?: {
    mimeType: string;
    originalUri: string;
    previewImage?: {
      uri: string;
    };
  };
  creatorProfile?: {
    handle: string;
    avatar?: {
      uri: string;
    };
  };
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

interface CreateCoinForm {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  initialSupply: string;
  initialPrice: string;
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
  const [selectedCoin, setSelectedCoin] = useState<ContentCoin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCoinForm>({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    initialSupply: '',
    initialPrice: '',
  });
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateCoin = async () => {
    if (!address || !walletClient || !publicClient) {
      alert("Please connect your wallet first");
      return;
    }

    if (chainId !== baseSepolia.id) {
      handleNetworkSwitch();
      return;
    }

    // Validate form inputs
    if (!createForm.name || !createForm.symbol || !createForm.imageUrl || !createForm.initialSupply || !createForm.initialPrice) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);
      const result = await createCoin(
        {
          name: createForm.name,
          symbol: createForm.symbol,
          media: {
            mimeType: 'image/png',
            originalUri: createForm.imageUrl,
          },
          initialSupply: BigInt(createForm.initialSupply),
          initialPrice: BigInt(createForm.initialPrice),
          creatorAddress: address,
        },
        walletClient,
        publicClient
      );
      
      if (!result) {
        throw new Error("Failed to create coin");
      }

      console.log('Create coin result:', result);
      alert("Coin created successfully!");
      setIsCreateModalOpen(false);
      await fetchDashboardData();
    } catch (error) {
      console.error('Create coin error:', error);
      const err = error as Error;
      alert(err.message || "Failed to create coin");
    } finally {
      setIsCreating(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch recent coins
      const recentResponse = await getCoinsNew({ count: 5 }) as ZoraResponse;
      if (recentResponse.data?.exploreList?.edges) {
        const recentCoins = recentResponse.data.exploreList.edges.map((edge) => ({
          id: edge.node.id,
          name: edge.node.name,
          symbol: edge.node.symbol || 'N/A',
          marketCap: edge.node.marketCap || '0',
          volume24h: edge.node.volume24h || '0',
          marketCapDelta24h: edge.node.marketCapDelta24h || '0',
          creatorAddress: edge.node.creatorAddress,
          contractAddress: edge.node.id.split(':')[1] || edge.node.contractAddress,
          description: edge.node.description,
          mediaContent: edge.node.mediaContent,
          creatorProfile: edge.node.creatorProfile
        }));
        setDashboard(prev => ({
          ...prev,
          recentCoins: { ...prev.recentCoins, coins: recentCoins, isLoading: false }
        }));
      }

      // Fetch top volume coins
      const volumeResponse = await getCoinsTopVolume24h({ count: 5 }) as ZoraResponse;
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
            description: edge.node.description,
            mediaContent: edge.node.mediaContent,
            creatorProfile: edge.node.creatorProfile
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
            description: edge.node.description,
            mediaContent: edge.node.mediaContent,
            creatorProfile: edge.node.creatorProfile
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
            description: edge.node.description,
            mediaContent: edge.node.mediaContent,
            creatorProfile: edge.node.creatorProfile
          };
        });
        console.log('Processed valuable coins:', valuableCoins);
        setDashboard(prev => ({
          ...prev,
          mostValuable: { ...prev.mostValuable, coins: valuableCoins, isLoading: false }
        }));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coins';
      setDashboard(prev => ({
        ...prev,
        topVolume: { ...prev.topVolume, error: errorMessage, isLoading: false },
        topGainers: { ...prev.topGainers, error: errorMessage, isLoading: false },
        mostValuable: { ...prev.mostValuable, error: errorMessage, isLoading: false },
        recentCoins: { ...prev.recentCoins, error: errorMessage, isLoading: false },
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderCoinModal = () => {
    if (!selectedCoin) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{selectedCoin.name}</h2>
              {selectedCoin.creatorProfile && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  {selectedCoin.creatorProfile.avatar?.uri && (
                    <img 
                      src={selectedCoin.creatorProfile.avatar.uri} 
                      alt={selectedCoin.creatorProfile.handle}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>@{selectedCoin.creatorProfile.handle}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {selectedCoin.mediaContent?.previewImage?.uri && (
            <div className="mb-6">
              <img 
                src={selectedCoin.mediaContent.previewImage.uri} 
                alt={selectedCoin.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {selectedCoin.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-300">{selectedCoin.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Market Cap</h3>
              <p className="text-xl font-bold">{selectedCoin.marketCap} ETH</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">24h Volume</h3>
              <p className="text-xl font-bold">{selectedCoin.volume24h} ETH</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">24h Change</h3>
              <p className={`text-xl font-bold ${parseFloat(selectedCoin.marketCapDelta24h) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.round(parseFloat(selectedCoin.marketCapDelta24h))}%
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Contract</h3>
              <a 
                href={`https://basescan.org/address/${selectedCoin.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 break-all"
              >
                {selectedCoin.contractAddress}
              </a>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex-1"
              onClick={() => handleBuy(selectedCoin)}
            >
              Buy
            </button>
            <button
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex-1"
              onClick={() => handleSell(selectedCoin)}
            >
              Sell
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCoinCard = (coin: ContentCoin) => {
    return (
      <div 
        key={coin.id} 
        className="border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col h-full cursor-pointer"
        onClick={() => {
          setSelectedCoin(coin);
          setIsModalOpen(true);
        }}
      >
        {coin.mediaContent?.previewImage?.uri && (
          <div className="mb-4">
            <img 
              src={coin.mediaContent.previewImage.uri} 
              alt={coin.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{coin.name}</h2>
            {coin.creatorProfile && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {coin.creatorProfile.avatar?.uri && (
                  <img 
                    src={coin.creatorProfile.avatar.uri} 
                    alt={coin.creatorProfile.handle}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span>@{coin.creatorProfile.handle}</span>
              </div>
            )}
          </div>
          <a 
            href={`https://zora.co/coins/${coin.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            {coin.symbol}
          </a>
        </div>
        {coin.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{coin.description}</p>
        )}
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

  const renderCreateCoinModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Create New Coin</h2>
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coin Name
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter coin name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={createForm.symbol}
                onChange={(e) => setCreateForm(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter symbol (e.g., BTC)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter coin description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={createForm.imageUrl}
                onChange={(e) => setCreateForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter image URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Supply
              </label>
              <input
                type="number"
                value={createForm.initialSupply}
                onChange={(e) => setCreateForm(prev => ({ ...prev, initialSupply: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter initial supply"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Price (in wei)
              </label>
              <input
                type="number"
                value={createForm.initialPrice}
                onChange={(e) => setCreateForm(prev => ({ ...prev, initialPrice: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter initial price in wei"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleCreateCoin}
              disabled={isCreating}
              className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Coin'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Create New Coin
        </button>
      </div>
      {renderSection(dashboard.recentCoins)}
      {renderSection(dashboard.topVolume)}
      {renderSection(dashboard.topGainers)}
      {renderSection(dashboard.mostValuable)}
      {isModalOpen && renderCoinModal()}
      {isCreateModalOpen && renderCreateCoinModal()}
    </div>
  );
} 