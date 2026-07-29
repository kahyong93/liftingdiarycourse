import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Lifting Course
      </h1>
      <Link href="/dashboard" className={cn(buttonVariants())}>
        Go to Dashboard
      </Link>
    </div>
  );
}
