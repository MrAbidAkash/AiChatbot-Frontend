import DashboardLayout from "@/components/Layout/DashboardLayout";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) {
      user = {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      };
    }
  } catch {
    // fallback if unauthenticated
  }

  return (
    <>
      <DashboardLayout user={user} />
      {children}
    </>
  );
}
