import { NextRequest, NextResponse } from 'next/server';
import { runBattleLoop, makeNewCalls, updateAllPrices } from '@/lib/battle';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Cron endpoint - called every 2 minutes to make new calls
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const action = request.nextUrl.searchParams.get('action');
    
    if (action === 'call') {
      // Force make new calls
      const result = await makeNewCalls();
      return NextResponse.json({ 
        success: true, 
        action: 'call',
        result: result ? {
          opus: result.opusCall?.token_symbol,
          codex: result.codexCall?.token_symbol
        } : null
      });
    }
    
    if (action === 'update') {
      // Just update prices
      const updated = await updateAllPrices();
      return NextResponse.json({ 
        success: true, 
        action: 'update',
        updated 
      });
    }
    
    // Default: run full battle loop (make calls + update prices)
    await runBattleLoop();
    
    return NextResponse.json({ 
      success: true, 
      action: 'loop',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
