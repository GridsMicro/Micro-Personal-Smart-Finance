import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getSpecialPortfolio } from "@/actions/public-portfolio";
import { getAssets } from "@/actions/market";
import SpecialPortAdminClient from "./special-port-client";

const SPECIAL_PORT_ID = "a0000000-0000-0000-0000-000000000001";

export default async function SpecialPortAdminPage() {
  await redirectIfNotAuth();
  const [detail, assetList] = await Promise.all([
    getSpecialPortfolio(SPECIAL_PORT_ID),
    getAssets(),
  ]);

  return (
    <SpecialPortAdminClient
      portfolio={detail.portfolio}
      holdings={detail.holdings}
      currentPrices={detail.currentPrices}
      assetList={assetList}
    />
  );
}
