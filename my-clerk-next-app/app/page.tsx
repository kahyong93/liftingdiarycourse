import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Lifting Course
      </h1>
      <Link href="/dashboard" className={cn(buttonVariants())}>
        Go to Dashboard
      </Link>
    </div>
  );
}
