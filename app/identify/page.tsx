import { IdentifyScreen } from "@/components/identify-screen";
import { Suspense } from "react";
import Loading from "@/app/loading";
type Props = { searchParams: Promise<{ mode?: string }> };
export default function Page(props: Props) { return <Suspense fallback={<Loading />}><IdentifyPage {...props} /></Suspense>; }
async function IdentifyPage({ searchParams }: Props) { return <IdentifyScreen photoMode={(await searchParams).mode === "photo"} />; }
