import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getNews, getNewsCategories } from "@/actions/news";
import AdminNewsClient from "./news-client";

export default async function AdminNewsPage() {
  await redirectIfNotAuth();
  const [newsList, categories] = await Promise.all([getNews(), getNewsCategories()]);
  return <AdminNewsClient initialNews={newsList} categories={categories} />;
}
