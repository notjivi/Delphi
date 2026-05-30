import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Missing topic parameter" }, { status: 400 });
    }

    // ============================================================================
    // 1. DYNAMIC TELEMETRY SIMULATION MATRIX (DATA GATHERING LAYER)
    // ============================================================================
    // In a full enterprise deployment, this is where you await your Anakin Wire webhooks.
    // To ensure the Vercel serverless function doesn't timeout during the hackathon demo,
    // we simulate distinct scenarios that Anakin provides based on the selected asset.
    let telemetryData;

    if (topic.toLowerCase().includes('bitcoin')) {
      // SCENARIO A: High Divergence / Alpha Signal (The Money Shot)
      telemetryData = {
        polymarket: { odds: 84, volume: "$14.2M", trend: "Violent upward surge in last 12 mins" },
        reuters: { headline: "EU regulators schedule quiet closed-door digital asset briefing", sentiment: "Neutral" },
        telemetry: { coingecko_momentum: "Flat", cboe_vix: "Stable at 12.8", google_trends: "Baseline" }
      };
    } else if (topic.toLowerCase().includes('cut')) {
      // SCENARIO B: Moderate Observation / Watching
      telemetryData = {
        polymarket: { odds: 52, volume: "$8.1M", trend: "Slowly drifting within weekly range" },
        reuters: { headline: "Fed officials signal data-dependent approach to upcoming rate cycle", sentiment: "Neutral" },
        telemetry: { coingecko_momentum: "N/A", cboe_vix: "13.4", google_trends: "Normal retail interest" }
      };
    } else {
      // SCENARIO C: Perfectly Efficient, Stable Market
      telemetryData = {
        polymarket: { odds: 14, volume: "$1.2M", trend: "Stagnant/Decaying volume" },
        reuters: { headline: "Mainstream political polls hold steady through weekend sessions", sentiment: "Stable" },
        telemetry: { coingecko_momentum: "Flat", cboe_vix: "13.1", google_trends: "Flat" }
      };
    }

    // ============================================================================
    // 2. GEMINI CONSENSUS ENGINE (ANALYSIS LAYER)
    // ============================================================================
    const prompt = `
      You are the Delphi Autonomous Asymmetric Information Engine.
      Analyze the following cross-node data for the topic: "${topic}".
      
      Anakin Wire Data Streams:
      - Polymarket: ${JSON.stringify(telemetryData.polymarket)}
      - Reuters Wire: ${JSON.stringify(telemetryData.reuters)}
      - Market Telemetry: ${JSON.stringify(telemetryData.telemetry)}

      Your task is to synthesize this data and output a JSON object representing the signal.

      CRITICAL ALGORITHMIC INSTRUCTION:
      When calculating the discrepancyIndex (0-100), you MUST use this weighted formula based on the data provided:
      - 45% weight to Conviction Divergence (Polymarket odds spiking while traditional media is flat)
      - 25% weight to Narrative Lag (Absence of correlated Reuters headlines)
      - 20% weight to Momentum Mismatch (CoinGecko/CBOE spot data diverging from prediction odds)
      - 10% weight to Attention Spikes (Google Trends/Retail telemetry)

      Calculate the final score, round it to the nearest whole number, and return it as the 'discrepancyIndex'.
      
      If the discrepancyIndex is > 85, set status to "CRITICAL".
      If it is between 60-85, set status to "WATCH".
      If it is < 60, set status to "STABLE".
    `;

    // Force strict JSON adherence using the Gemini Structured Outputs schema
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            topic: { type: 'STRING' },
            timestamp: { type: 'STRING' },
            marketData: {
              type: 'OBJECT',
              properties: {
                question: { type: 'STRING' },
                predictionOdds: { type: 'NUMBER' },
                volume: { type: 'STRING' },
                liquidity: { type: 'STRING' },
                marketId: { type: 'STRING' }
              },
              required: ["question", "predictionOdds", "volume", "liquidity", "marketId"]
            },
            newsData: {
              type: 'OBJECT',
              properties: {
                headline: { type: 'STRING' },
                telemetry: { type: 'STRING' }
              },
              required: ["headline", "telemetry"]
            },
            analysis: {
              type: 'OBJECT',
              properties: {
                discrepancyIndex: { type: 'NUMBER' },
                status: { type: 'STRING', enum: ["STABLE", "WATCH", "CRITICAL"] },
                analyticalThesis: { type: 'STRING' }
              },
              required: ["discrepancyIndex", "status", "analyticalThesis"]
            }
          },
          required: ["topic", "timestamp", "marketData", "newsData", "analysis"]
        }
      }
    });

    const signalData = JSON.parse(response.text || '{}');
    
    // Fallback timestamp generation
    if (!signalData.timestamp) {
      signalData.timestamp = new Date().toISOString();
    }

    return NextResponse.json(signalData);

  } catch (error: any) {
    console.error("Delphi Engine Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process signal" },
      { status: 500 }
    );
  }
}