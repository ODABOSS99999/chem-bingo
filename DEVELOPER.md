# Dieckmingo

Public classroom bingo, no accounts required. The board is a square with 25 cells. Each daily card uses 25 randomly selected unique terms, without a free square.

## Add terms

Edit `wordbank.json`. Add another quoted string to the array, separated by a comma. Keep at least 25 unique nonempty terms. Existing cards stay unchanged for the day; newly generated cards use the new bank after deployment. Never remove terms from already-issued cards in the database.

## Scoring and reset

Server calculates 5 points per marked cell plus 25 points per completed row, column, or diagonal. Overlapping lines each earn their bonus. Undoing a cell removes any affected line bonuses. The day boundary uses America/Chicago, including daylight saving time. Queries select only the current day, so reset needs no scheduled job. Older rows are retained, not displayed.

## Pattern match

The leaderboard compares marked term overlap and timestamps within 2 seconds, after at least 5 marks each. This heuristic is not a calibrated cheating probability. Identical card layouts are flagged separately. No algorithm can verify that something happened in class. Browser cookies preserve a participant's daily card; clearing cookies or using another browser permits a new identity.

## Hosting

The shared database and server run on Sites / Cloudflare D1, using `.openai/hosting.json`. GitHub stores editable source. GitHub Pages alone cannot run this server or shared database. No GitHub Student Developer Pack credit has been claimed or activated by this project.

`npm install` installs dependencies. `npm run build` builds the Worker. `npm run dev` starts the local preview. Follow the Sites publication workflow to publish changes. Database schema is in `db/schema.ts`, migrations in `drizzle/`.
