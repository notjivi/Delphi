// lib/anakin.ts
const ANAKIN_API_KEY = process.env.ANAKIN_API_KEY!;
const BASE_URL = 'https://anakin.io/v1/wire';

async function runWireTask(action_id: string, params: Record<string, any>) {
  console.log(`[Anakin] Submitting task: ${action_id}`);
  
  const submitRes = await fetch(`${BASE_URL}/task`, {
    method: 'POST',
    headers: {
      'X-API-Key': ANAKIN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action_id, params }),
  });

  if (!submitRes.ok) {
    throw new Error(`Anakin submit failed: ${submitRes.statusText}`);
  }

  const submitData = await submitRes.json();
  const targetJobId = submitData.job_id || submitData.id;

  if (!targetJobId) {
    throw new Error(`No job_id returned from Anakin. Raw response: ${JSON.stringify(submitData)}`);
  }

  // Poll until done using the correct /jobs/ endpoint
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    console.log(`[Anakin] Polling iteration ${i + 1} for job: ${targetJobId}`);
    
    const pollRes = await fetch(`${BASE_URL}/jobs/${targetJobId}`, {
      headers: { 'X-API-Key': ANAKIN_API_KEY },
    });

    if (!pollRes.ok) {
      throw new Error(`Anakin poll failed: ${pollRes.statusText}`);
    }

    const data = await pollRes.json();

    if (data.status === 'completed' || data.status === 'success') {
      return data.result || data.data;
    }
    if (data.status === 'failed') {
      throw new Error(`Wire task failed on server: ${data.error || JSON.stringify(data)}`);
    }
  }

  throw new Error('Wire task polling cycle timed out after 15 seconds');
}

export async function searchPolymarketMarkets(query: string) {
  return runWireTask('pm_search_markets', { query, limit: 5, closed: false });
}

export async function getMarketFull(market_id: string) {
  return runWireTask('pm_get_market_full', { market_id });
}

// Fixed Action ID for Reuters
export async function searchReuters(query: string) {
  return runWireTask('re_search', { query, limit: 5 });
}