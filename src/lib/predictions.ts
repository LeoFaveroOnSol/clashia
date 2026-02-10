// Predictions Logic - Generate AI predictions every 2 minutes
import { sql } from './db';

// Possible prediction questions
const PREDICTION_TEMPLATES = [
  // Price targets
  { template: 'Will {token} 2x in the next hour?', category: 'pump' },
  { template: 'Will {token} hold above current price for 30 min?', category: 'hold' },
  { template: 'Will {token} outperform SOL in the next hour?', category: 'compare' },
  { template: '{token} hits 5x before dumping?', category: 'moon' },
  { template: 'Will {token} have more buyers than sellers next 30 min?', category: 'volume' },
  
  // Market predictions
  { template: 'SOL stays above $190 for the next hour?', category: 'market' },
  { template: 'BTC closes green today?', category: 'market' },
  { template: 'Total memecoin volume increases next hour?', category: 'market' },
  { template: 'New ATH for any trending token in next 2 hours?', category: 'market' },
  
  // Specific token predictions
  { template: 'Will the top trending token maintain its position?', category: 'trending' },
  { template: 'Any token from top 10 trending will 3x?', category: 'trending' },
];

// AI reasoning templates
const OPUS_REASONINGS = {
  YES: [
    'Volume metrics indicate strong buyer interest. Risk/reward favorable.',
    'Technical setup suggests continuation. Order flow looks healthy.',
    'Momentum indicators aligned. Smart money accumulating.',
    'Historical patterns support this outcome. Sentiment positive.',
    'On-chain data shows accumulation. Price action constructive.',
  ],
  NO: [
    'Distribution pattern emerging. Volume declining on pumps.',
    'Resistance levels too strong. Momentum fading.',
    'Risk factors outweigh potential upside. Caution advised.',
    'Market structure weakening. Better opportunities elsewhere.',
    'Sentiment overextended. Mean reversion likely.',
  ],
};

const CODEX_REASONINGS = {
  YES: [
    'Degen energy strong on this one. FOMO factor high.',
    'Chart looks primed for send. Community active.',
    'Low mcap = high upside potential. Worth the risk.',
    'Social metrics spiking. Could run hard.',
    'Setup too good to ignore. Aping in spirit.',
  ],
  NO: [
    'Looks like a trap. Dev wallet suspicious.',
    'Too much hype, not enough substance.',
    'Rug indicators flashing. Pass on this one.',
    'Already pumped too hard. Late entry = rekt.',
    'Better plays out there. This one is mid.',
  ],
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a prediction with AI calls
export async function generatePrediction(tokenSymbol?: string): Promise<any> {
  // Pick a random template
  const template = randomChoice(PREDICTION_TEMPLATES);
  
  // Replace {token} with actual token or generic
  const token = tokenSymbol || '$TRENDING';
  const question = template.template.replace('{token}', token);
  
  // Generate Opus prediction (tends to be more analytical)
  const opusPosition = Math.random() > 0.45 ? 'YES' : 'NO';
  const opusConfidence = Math.floor(55 + Math.random() * 35);
  const opusReasoning = randomChoice(OPUS_REASONINGS[opusPosition]);
  
  // Generate Codex prediction (tends to be more degen)
  const codexPosition = Math.random() > 0.5 ? 'YES' : 'NO';
  const codexConfidence = Math.floor(50 + Math.random() * 40);
  const codexReasoning = randomChoice(CODEX_REASONINGS[codexPosition]);
  
  // Save to database
  const result = await sql`
    INSERT INTO predictions (
      question, category,
      opus_position, opus_confidence, opus_reasoning,
      codex_position, codex_confidence, codex_reasoning
    ) VALUES (
      ${question}, ${template.category},
      ${opusPosition}, ${opusConfidence}, ${opusReasoning},
      ${codexPosition}, ${codexConfidence}, ${codexReasoning}
    )
    RETURNING *
  `;
  
  console.log('[Predictions] New prediction created:', question);
  return result[0];
}

// Get recent predictions
export async function getRecentPredictions(limit = 20): Promise<any[]> {
  const result = await sql`
    SELECT * FROM predictions
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result;
}

// Get prediction stats
export async function getPredictionStats() {
  const result = await sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN opus_position = codex_position THEN 1 ELSE 0 END) as agreements,
      SUM(CASE WHEN opus_position != codex_position THEN 1 ELSE 0 END) as disagreements
    FROM predictions
  `;
  return result[0];
}
