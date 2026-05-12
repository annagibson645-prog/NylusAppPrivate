import { redirect } from "next/navigation";
export default function Page({ params }: { params: { name: string } }) {
  redirect(`/hubs?domain=${params.name}`);
}
