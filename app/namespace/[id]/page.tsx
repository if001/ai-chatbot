import { auth } from "@/app/(auth)/auth";
import NameSpace from "@/components/namespace";
import { redirect } from "next/navigation";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await auth();
  if (!session) {
    redirect("/api/auth/guest");
  }

  return <NameSpace id={id} session={session} />;
}
