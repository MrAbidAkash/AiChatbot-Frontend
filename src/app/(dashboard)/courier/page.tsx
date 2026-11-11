// src/app/(dashboard)/courier/page.tsx
import SteadfastManager from "@/components/SteadfastManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "কুরিয়ার ও পার্সেল (Steadfast) | ChatTime AI",
  description: "Steadfast কুরিয়ার পার্সেল বুকিং, লাইভ ট্র্যাকিং ও লেজার ম্যানেজমেন্ট",
};

export default function CourierPage() {
  return <SteadfastManager />;
}

