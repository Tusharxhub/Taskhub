"use client";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function LogoutButton({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
      className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
    >
      {children}
    </button>
  );
}
