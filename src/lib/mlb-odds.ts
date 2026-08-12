export interface OddsApiGame {
  away_team: string;
  home_team: string;
  commence_time: string;
  bookmakers?: Array<{
    markets?: Array<{
      key?: string;
      outcomes?: Array<{ name?: string; price?: number }>;
    }>;
  }>;
}

export interface OddsSuggestion {
  game: string;
  pick: string;
  odds: number;
  commenceTime: string;
}

export function buildOddsGameLabel(game: OddsApiGame) {
  return `${game.away_team} @ ${game.home_team}`;
}

export function buildOddsSuggestionList(games: OddsApiGame[]): OddsSuggestion[] {
  const suggestions: OddsSuggestion[] = [];

  for (const game of games) {
    const gameLabel = buildOddsGameLabel(game);
    const h2hMarket = game.bookmakers
      ?.flatMap((bookmaker) => bookmaker.markets ?? [])
      .find((market) => market.key === "h2h");

    const outcomes = h2hMarket?.outcomes ?? [];

    for (const outcome of outcomes) {
      if (!outcome.name || outcome.price == null) continue;
      suggestions.push({
        game: gameLabel,
        pick: outcome.name,
        odds: Number(outcome.price),
        commenceTime: game.commence_time,
      });
    }
  }

  return suggestions;
}
