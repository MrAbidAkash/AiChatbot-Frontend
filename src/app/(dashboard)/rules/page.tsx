import ShopRules from "@/components/ShopRules";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "শপের নিয়মাবলী ও পলিসি | ChatTime AI",
  description: "আপনার শপের ডেলিভারি চার্জ, রিটার্ন পলিসি ও AI নির্দেশনা নির্ধারণ করুন",
};

export default function RulesPage() {
  return <ShopRules />;
}

