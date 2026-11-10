// src/app/(dashboard)/wallet/page.tsx
import WalletManager from "@/components/WalletManager";

export const metadata = {
  title: "ব্যালেন্স ও ওয়ালেট রিচার্জ | ChatTime AI",
  description: "ChatTime AI রিপ্লাই ক্রেডিট, রিচার্জ প্যাক ও বিলিং হিস্ট্রি",
};

export default function WalletPage() {
  return <WalletManager />;
}

