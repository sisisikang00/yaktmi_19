import { DetailScreen } from "@/components/detail-screen";
import { Suspense } from "react";
import Loading from "@/app/loading";
type Props = { params: Promise<{ id: string }> };
export default function Page(props: Props) { return <Suspense fallback={<Loading />}><MedicinePage {...props} /></Suspense>; }
async function MedicinePage({ params }: Props) { return <DetailScreen id={(await params).id} />; }
