import { NextResponse } from "next/server";

const API_KEY = process.env.ODDS_API_KEY;

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "ODDS_API_KEY is not configured. Add it to .env.local." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?regions=us&markets=h2h&oddsFormat=american&apiKey=" +
        encodeURIComponent(API_KEY),
      { headers: { Accept: "application/json" }, next: { revalidate: 60 } }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch MLB odds", details: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("MLB odds fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch MLB odds" }, { status: 500 });
  }
}
