"use client";
import { DriverHome } from "@/components/home/DriverHome";
import { OwnerHome } from "@/components/home/OwnerHome";
import { useReadySession } from "@/hooks/useSession";

export default function HomePage() {
  const { role } = useReadySession();
  return role === "DRIVER" ? <DriverHome /> : <OwnerHome />;
}
