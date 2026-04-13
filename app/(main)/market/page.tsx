import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getAssetsWithPrices } from "@/actions/market";
import MarketClient from "./market-client";

export default async function MarketPage() {
  await redirectIfNotAuth();
  const assetsWithPrices = await getAssetsWithPrices();
  return <MarketClient initialAssets={assetsWithPrices} />;
}
