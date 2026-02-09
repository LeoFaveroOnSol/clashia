// API helpers for fetching token data

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  price: number;
  mcap: number;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
}

export interface TrendingPool {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  price: number;
  mcap: number | null;
  volume24h: number;
  priceChange24h: number;
  txns24h: number;
}

// Fetch trending pools from GeckoTerminal
export async function getTrendingSolana(): Promise<TrendingPool[]> {
  try {
    const res = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?page=1',
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    
    return data.data?.slice(0, 20).map((pool: any) => ({
      address: pool.relationships?.base_token?.data?.id?.replace('solana_', '') || '',
      name: pool.attributes?.name?.split(' / ')[0] || '',
      symbol: pool.attributes?.name?.split(' / ')[0] || '',
      chain: 'solana',
      price: parseFloat(pool.attributes?.base_token_price_usd || '0'),
      mcap: parseFloat(pool.attributes?.fdv_usd || '0') || null,
      volume24h: parseFloat(pool.attributes?.volume_usd?.h24 || '0'),
      priceChange24h: parseFloat(pool.attributes?.price_change_percentage?.h24 || '0'),
      txns24h: (pool.attributes?.transactions?.h24?.buys || 0) + (pool.attributes?.transactions?.h24?.sells || 0),
    })) || [];
  } catch (error) {
    console.error('Error fetching trending Solana:', error);
    return [];
  }
}

// Fetch token price from DexScreener
export async function getTokenPrice(address: string, chain = 'solana'): Promise<TokenData | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { next: { revalidate: 30 } }
    );
    const data = await res.json();
    
    const pair = data.pairs?.[0];
    if (!pair) return null;
    
    return {
      address,
      symbol: pair.baseToken?.symbol || '',
      name: pair.baseToken?.name || '',
      chain: pair.chainId || chain,
      price: parseFloat(pair.priceUsd || '0'),
      mcap: parseFloat(pair.marketCap || pair.fdv || '0'),
      volume24h: parseFloat(pair.volume?.h24 || '0'),
      priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
      liquidity: parseFloat(pair.liquidity?.usd || '0'),
    };
  } catch (error) {
    console.error('Error fetching token price:', error);
    return null;
  }
}

// Get multiple token prices in batch
export async function getTokenPrices(addresses: string[]): Promise<Map<string, TokenData>> {
  const results = new Map<string, TokenData>();
  
  // DexScreener allows batch of 30
  const chunks = [];
  for (let i = 0; i < addresses.length; i += 30) {
    chunks.push(addresses.slice(i, i + 30));
  }
  
  for (const chunk of chunks) {
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(',')}`,
        { next: { revalidate: 30 } }
      );
      const data = await res.json();
      
      for (const pair of data.pairs || []) {
        const address = pair.baseToken?.address;
        if (address && !results.has(address)) {
          results.set(address, {
            address,
            symbol: pair.baseToken?.symbol || '',
            name: pair.baseToken?.name || '',
            chain: pair.chainId || 'solana',
            price: parseFloat(pair.priceUsd || '0'),
            mcap: parseFloat(pair.marketCap || pair.fdv || '0'),
            volume24h: parseFloat(pair.volume?.h24 || '0'),
            priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
            liquidity: parseFloat(pair.liquidity?.usd || '0'),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching batch prices:', error);
    }
  }
  
  return results;
}
