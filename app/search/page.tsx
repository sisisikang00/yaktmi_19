import { SearchScreen } from "@/components/search-screen";
import { Suspense } from "react";
import Loading from "@/app/loading";
type Props = { searchParams: Promise<{ q?: string; source?: string; page?: string }> };
export default function Page(props: Props) { return <Suspense fallback={<Loading />}><SearchPage {...props} /></Suspense>; }
async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const page = typeof params.page === "string" && /^[1-9]\d{0,4}$/.test(params.page) ? Number(params.page) : 1;
  const source = params.source === "easy" ? "easy" : "permit";
  return <SearchScreen key={`${query}:${source}:${page}`} query={query} source={source} page={page} />;
}
