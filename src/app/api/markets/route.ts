import { NextResponse } from 'next/server';

interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string; // JSON string like '["0.45", "0.55"]'
  outcomes: string; // JSON string like '["Yes", "No"]'
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
  source: 'polymarket';
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  image?: string;
  description?: string;
}

export async function GET() {
  try {
    // Fetch active markets from Polymarket
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=50',
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Polymarket');
    }

    const markets: PolymarketMarket[] = await response.json();

    // Transform and filter markets
    const transformed: TransformedMarket[] = markets
      .filter(m => {
        // Filter for binary yes/no markets with decent volume
        const outcomes = JSON.parse(m.outcomes || '[]');
        return outcomes.length === 2 && parseFloat(m.volume) > 10000;
      })
      .map(m => {
        const prices = JSON.parse(m.outcomePrices || '["0.5", "0.5"]');
        return {
          id: m.id,
          question: m.question,
          source: 'polymarket' as const,
          yesPrice: parseFloat(prices[0]) * 100,
          noPrice: parseFloat(prices[1]) * 100,
          volume: parseFloat(m.volume),
          liquidity: parseFloat(m.liquidity),
          endDate: m.endDate,
          image: m.image,
          description: m.description?.slice(0, 200),
        };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 20);

    return NextResponse.json({ 
      markets: transformed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
