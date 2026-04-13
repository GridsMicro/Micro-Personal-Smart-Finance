/**
 * Admin — API Management
 * จัดการ API keys และ trigger price update manually
 */

import { redirectIfNotAuth } from "@/app/proxy/auth";
import AdminApiClient from "./api-client";

export default async function AdminApiPage() {
  await redirectIfNotAuth();
  return <AdminApiClient />;
}
