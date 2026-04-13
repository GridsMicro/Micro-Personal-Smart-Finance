import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getWatchlists } from "@/actions/watchlist";
import WatchlistClient from "./watchlist-client";

export default async function WatchlistPage() {
  await redirectIfNotAuth();
  const watchlists = await getWatchlists();
  return <WatchlistClient initialWatchlists={watchlists} />;
}
