// src/app/(dashboard)/orders/page.tsx
import OrdersManager from "@/components/OrdersManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "কনফার্মড অর্ডারসমূহ (Orders) | ChatTime AI",
  description: "AI সেলস চ্যাটবট দ্বারা বুক করা কাস্টমারদের অর্ডার ও গুগল শিট স্টক ম্যানেজমেন্ট",
};

export default function OrdersPage() {
  return <OrdersManager />;
}

