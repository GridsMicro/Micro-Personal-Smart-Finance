import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getAssets } from "@/actions/market";
import AdminAssetsClient from "./assets-client";

export default async function AdminAssetsPage() {
  await redirectIfNotAuth();
  const assets = await getAssets();
  return <AdminAssetsClient initialAssets={assets} />;
}
