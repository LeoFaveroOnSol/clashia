import { NextResponse } from 'next/server';

interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string;
  outcomes: string;
  volume: string;
  liquidity: string;
  endDate: string;
  image?: string;
  description?: string;
  closed: boolean;
  active: boolean;
}

interface TransformedMarket {
  id: string;
  question: string;
  source: 'polymarket' | 'daily';
  category: 'politics' | 'crypto' | 'sports' | 'tech' | 'other';
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  image?: string;
  description?: string;
  resolvesToday: boolean;
}

// Fetch current crypto prices
async function getCryptoPrices(): Promise<{ btc: number; eth: number; sol: number }> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd',
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    return {
      btc: data.bitcoin?.usd || 97000,
      eth: data.ethereum?.usd || 2800,
      sol: data.solana?.usd || 190,
    };
  } catch {
    return { btc: 97000, eth: 2800, sol: 190 };
  }
}

// Generate daily crypto predictions
function generateDailyPredictions(prices: { btc: number; eth: number; sol: number }): TransformedMarket[] {
  const today = new Date();
  const endOfDay = new Date(today);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  const btcTarget = Math.round(prices.btc / 1000) * 1000; // Round to nearest 1000
  const ethTarget = Math.round(prices.eth / 100) * 100; // Round to nearest 100
  const solTarget = Math.round(prices.sol / 10) * 10; // Round to nearest 10

  return [
    {
      id: 'daily-btc-above',
      question: `Will Bitcoin close above $${btcTarget.toLocaleString()} today?`,
      source: 'daily',
      category: 'crypto',
      yesPrice: prices.btc > btcTarget ? 65 : 45,
      noPrice: prices.btc > btcTarget ? 35 : 55,
      volume: 0,
      liquidity: 0,
      endDate: endOfDay.toISOString(),
      description: `Current BTC: $${prices.btc.toLocaleString()}`,
      resolvesToday: true,
    },
    {
      id: 'daily-eth-above',
      question: `Will Ethereum close above $${ethTarget.toLocaleString()} today?`,
      source: 'daily',
      category: 'crypto',
      yesPrice: prices.eth > ethTarget ? 60 : 40,
      noPrice: prices.eth > ethTarget ? 40 : 60,
      volume: 0,
      liquidity: 0,
      endDate: endOfDay.toISOString(),
      description: `Current ETH: $${prices.eth.toLocaleString()}`,
      resolvesToday: true,
    },
    {
      id: 'daily-sol-above',
      question: `Will Solana close above $${solTarget} today?`,
      source: 'daily',
      category: 'crypto',
      yesPrice: prices.sol > solTarget ? 62 : 42,
      noPrice: prices.sol > solTarget ? 38 : 58,
      volume: 0,
      liquidity: 0,
      endDate: endOfDay.toISOString(),
      description: `Current SOL: $${prices.sol.toFixed(2)}`,
      resolvesToday: true,
    },
    {
      id: 'daily-btc-green',
      question: 'Will Bitcoin close green (higher than 24h ago)?',
      source: 'daily',
      category: 'crypto',
      yesPrice: 52,
      noPrice: 48,
      volume: 0,
      liquidity: 0,
      endDate: endOfDay.toISOString(),
      description: 'Based on 24h price change at market close',
      resolvesToday: true,
    },
    {
      id: 'daily-eth-outperform',
      question: 'Will ETH outperform BTC today (% change)?',
      source: 'daily',
      category: 'crypto',
      yesPrice: 45,
      noPrice: 55,
      volume: 0,
      liquidity: 0,
      endDate: endOfDay.toISOString(),
      description: 'Comparing 24h % change of ETH vs BTC',
      resolvesToday: true,
    },
    {
      id: 'daily-sol-outperform',
      question: 'Will SOL outperform BTC today (% change)?',
      source: 'daily',
      category: 'crypto',
      yesPrice: 48,
      noPrice: 52,
      volume: 0,
      liquidity: 0,
      endDate: endOfDay.toISOString(),
      description: 'Comparing 24h % change of SOL vs BTC',
      resolvesToday: true,
    },
  ];
}

function categorizeMarket(question: string): 'politics' | 'crypto' | 'sports' | 'tech' | 'other' {
  const q = question.toLowerCase();
  if (q.includes('trump') || q.includes('biden') || q.includes('congress') || q.includes('senate') || q.includes('election') || q.includes('tariff') || q.includes('deport')) return 'politics';
  if (q.includes('bitcoin') || q.includes('ethereum') || q.includes('crypto') || q.includes('btc') || q.includes('eth') || q.includes('solana')) return 'crypto';
  if (q.includes('super bowl') || q.includes('nfl') || q.includes('nba') || q.includes('world cup') || q.includes('championship')) return 'sports';
  if (q.includes('ai') || q.includes('spacex') || q.includes('tesla') || q.includes('gta') || q.includes('apple') || q.includes('google')) return 'tech';
  return 'other';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all'; // all, today, week
  
  try {
    // Fetch crypto prices and Polymarket data in parallel
    const [prices, polymarketRes] = await Promise.all([
      getCryptoPrices(),
      fetch('https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=100', {
        next: { revalidate: 60 },
      }),
    ]);

    const polymarketData: PolymarketMarket[] = polymarketRes.ok ? await polymarketRes.json() : [];

    // Transform Polymarket data
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const polymarketTransformed: TransformedMarket[] = polymarketData
      .filter(m => {
        const outcomes = JSON.parse(m.outcomes || '[]');
        return outcomes.length === 2 && parseFloat(m.volume) > 5000;
      })
      .map(m => {
        const prices = JSON.parse(m.outcomePrices || '["0.5", "0.5"]');
        const endDate = new Date(m.endDate);
        const resolvesToday = endDate <= endOfToday;
        const resolvesThisWeek = endDate <= endOfWeek;
        
        return {
          id: m.id,
          question: m.question,
          source: 'polymarket' as const,
          category: categorizeMarket(m.question),
          yesPrice: parseFloat(prices[0]) * 100,
          noPrice: parseFloat(prices[1]) * 100,
          volume: parseFloat(m.volume),
          liquidity: parseFloat(m.liquidity),
          endDate: m.endDate,
          image: m.image,
          description: m.description?.slice(0, 150),
          resolvesToday,
          resolvesThisWeek,
        };
      });

    // Generate daily predictions
    const dailyPredictions = generateDailyPredictions(prices);

    // Combine all markets
    let allMarkets = [...dailyPredictions, ...polymarketTransformed];

    // Apply filter
    if (filter === 'today') {
      allMarkets = allMarkets.filter(m => m.resolvesToday);
    } else if (filter === 'week') {
      allMarkets = allMarkets.filter(m => {
        const end = new Date(m.endDate);
        return end <= endOfWeek;
      });
    }

    // Sort: today first, then by volume
    allMarkets.sort((a, b) => {
      if (a.resolvesToday && !b.resolvesToday) return -1;
      if (!a.resolvesToday && b.resolvesToday) return 1;
      return b.volume - a.volume;
    });

    return NextResponse.json({
      markets: allMarkets.slice(0, 30),
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', markets: [], prices: { btc: 0, eth: 0, sol: 0 } },
      { status: 500 }
    );
  }
}
