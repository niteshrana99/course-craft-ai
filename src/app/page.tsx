"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  router.push("/create");

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  );
}
