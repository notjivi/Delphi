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
    // 1. ANAKIN WIRE ORCHESTRATION (DATA GATHERING LAYER)
    // ============================================================================
    // In a full enterprise deployment, this is where you await your Anakin Wire webhooks.
    // To ensure the Vercel serverless function doesn't timeout during the hackathon demo,
    // we simulate the structured telemetry payload that Anakin provides to the AI.
    
    const telemetryData = {
      polymarket: {
        odds: topic.toLowerCase().includes('bitcoin') ? 81 : 42,
        volume: "$10.4M",
        trend: "Spiking rapidly in last 15 minutes"
      },
      reuters: {
        headline: topic.toLowerCase().includes('bitcoin') ? "EU lawmakers debate new crypto regulations" : "Markets remain cautious ahead of data",
        sentiment: "Neutral/Bearish"
      },
      telemetry: {
        coingecko_momentum: "Flat",
        cboe_vix: "Stable at 13.2",
        google_trends: "No significant breakout"
      }
    };

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