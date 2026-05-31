# DELPHI: Autonomous Asymmetric Information Terminal

**Built for the Anakin Build-a-thon 2026**

Traditional market tools wait for the news to break. By the time a headline is published, the market has already moved. 

**Delphi** is an autonomous quantitative intelligence terminal designed to programmatically expose financial information asymmetry in real-time. 

Instead of relying on a single lagging indicator, Delphi concurrently polls live order-book probabilities, cross-examines them against breaking news wires, and injects live market telemetry to calculate a tradeable **Market Discrepancy Index (MDI)**.

---

### Market Discrepancy Index (MDI)

Delphi calculates a proprietary 0-100 score in real-time using a weighted multi-factor model evaluated by the Gemini 2.5 Flash consensus engine:

$$ MDI = (0.45 \times \text{Conviction Divergence}) + (0.25 \times \text{Narrative Lag}) + (0.20 \times \text{Momentum Mismatch}) + (0.10 \times \text{Attention Spike}) $$

**Signal Thresholds:**
- **MDI > 85** → **Critical Alpha Opportunity** (Rare — appears in only ~4-6% of sweeps)
- **MDI > 92** → **Extreme Asymmetry** (Smart money moving while the world is blind)

### Unique Edge Over Existing Tools

| Feature                    | Traditional Tools       | Delphi Terminal               | Advantage    |
|---------------------------|-------------------------|-------------------------------|--------------|
| Intelligence Matrix       | Single source           | 5 live concurrent sources     | **High**     |
| Execution Loop            | Manual refresh          | Autonomous 60s polling        | **High**     |
| Divergence Metric         | None                    | Proprietary MDI (0-100)       | **Unique**   |
| Detection Speed           | Post-headline           | Pre-narrative asymmetry       | **Strong**   |
| Compute Efficiency        | Heavy                   | Browser-native hibernation    | **Practical**|

---

## The Multi-Node Architecture

Delphi orchestrates a coordinated intelligence matrix using **Anakin Wire** + **Gemini 2.5 Flash**:

1. **Conviction Layer (Polymarket)** — Tracks where whales and smart money are placing capital via live order books.
2. **Narrative Layer (Reuters)** — Captures the prevailing public narrative from global news wires.
3. **Dynamic Telemetry Layer**:
   - **CoinGecko** — Live spot price and volume momentum (crypto)
   - **CBOE VIX** — Macro volatility and fear gauge
   - **Google Trends** — Retail attention spikes

<img width="1473" height="727" alt="image" src="https://github.com/user-attachments/assets/c2159a35-6e91-40a2-a614-3950fcb858c1" />


When these realities diverge significantly, Delphi flags high-conviction opportunities before the market corrects.

---

## ✨ Core Features

- **Autonomous Polling Loop** — Sweeps your custom watchlist every 60 seconds
- **Market Discrepancy Index (MDI)** — Real-time quantified alpha signal
- **Production Guardrails** — `visibilitychange` kill-switch automatically pauses polling when tab loses focus (saves API costs)
- **Local Fallback Engine** — Continues working with pure math calculations if AI APIs timeout
- **Institutional-Grade UI** — Dense Bloomberg Terminal-style interface built with Tailwind CSS
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/b6735321-dd0a-45e4-b23b-1b19a42f40c7" />
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/c1ae5786-23a7-494c-b839-d9a4657e7439" />

---

## Local Development

```bash
git clone https://github.com/notjivi/Delphi
cd delphi
npm install
```

Create `.env.local` in the root:

```env
ANAKIN_API_KEY=your_anakin_wire_key_here
GEMINI_API_KEY=your_google_gemini_key_here
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Data Layer**: Anakin Wire (Polymarket, Reuters, CoinGecko, CBOE, Google Trends)
- **AI Engine**: Google Gemini 2.5 Flash
- **Deployment**: Vercel (Serverless)

---

## License

MIT License — Feel free to fork and build upon this architecture.

---

**Made in 48 hours for the Anakin Build-a-thon.**
