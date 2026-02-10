import { NextResponse } from 'next/server';
import { getRecentPredictions, getPredictionStats } from '@/lib/predictions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [predictions, stats] = await Promise.all([
      getRecentPredictions(30),
      getPredictionStats()
    ]);

    // Format predictions for frontend
    const formattedPredictions = predictions.map((p: any) => ({
      id: p.id,
      question: p.question,
      category: p.category,
      opus: {
        position: p.opus_position,
        confidence: p.opus_confidence,
        reasoning: p.opus_reasoning
      },
      codex: {
        position: p.codex_position,
        confidence: p.codex_confidence,
        reasoning: p.codex_reasoning
      },
      agreement: p.opus_position === p.codex_position,
      resolved: p.resolved,
      result: p.result,
      createdAt: p.created_at
    }));

    return NextResponse.json({
      success: true,
      predictions: formattedPredictions,
      stats: {
        total: parseInt(stats?.total || '0'),
        agreements: parseInt(stats?.agreements || '0'),
        disagreements: parseInt(stats?.disagreements || '0')
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      predictions: [],
      stats: { total: 0, agreements: 0, disagreements: 0 }
    }, { status: 500 });
  }
}
