import { auth } from "@/app/(auth)/auth";
import NameSpaceUpload from "@/components/namespace-upload";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }
  return <NameSpaceUpload session={session} />;
}
