import { NextRequest, NextResponse } from 'next/server';
import { runBattleLoop, startNewRound, updatePrices, checkAndEndRound } from '@/lib/battle';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for Vercel

// Cron endpoint - called periodically to manage battles
export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const action = request.nextUrl.searchParams.get('action');
    
    if (action === 'start') {
      // Force start a new round
      const result = await startNewRound(24);
      return NextResponse.json({ 
        success: true, 
        action: 'start',
        result 
      });
    }
    
    if (action === 'update') {
      // Just update prices
      const updated = await updatePrices();
      return NextResponse.json({ 
        success: true, 
        action: 'update',
        updated 
      });
    }
    
    if (action === 'end') {
      // Force check and end round
      const result = await checkAndEndRound();
      return NextResponse.json({ 
        success: true, 
        action: 'end',
        result 
      });
    }
    
    // Default: run full battle loop
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

// Also allow POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
