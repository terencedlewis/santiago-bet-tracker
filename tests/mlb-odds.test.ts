import test from "node:test";
import assert from "node:assert/strict";

import { buildOddsSuggestionList, buildOddsGameLabel } from "../src/lib/mlb-odds";

test("build Odds API suggestions from MLB game data", () => {
  const data = [
    {
      away_team: "Yankees",
      home_team: "Red Sox",
      commence_time: "2026-08-12T19:35:00Z",
      bookmakers: [
        {
          markets: [
            {
              key: "h2h",
              outcomes: [
                { name: "Yankees", price: 125 },
                { name: "Red Sox", price: -145 },
              ],
            },
          ],
        },
      ],
    },
  ];

  const suggestions = buildOddsSuggestionList(data);

  assert.deepEqual(buildOddsGameLabel(data[0]), "Yankees @ Red Sox");
  assert.equal(suggestions.length, 2);
  assert.deepEqual(suggestions[0], {
    game: "Yankees @ Red Sox",
    pick: "Yankees",
    odds: 125,
    commenceTime: "2026-08-12T19:35:00Z",
  });
  assert.deepEqual(suggestions[1], {
    game: "Yankees @ Red Sox",
    pick: "Red Sox",
    odds: -145,
    commenceTime: "2026-08-12T19:35:00Z",
  });
});
