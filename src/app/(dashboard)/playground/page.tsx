import AIPlayground from "@/components/AIPlayground";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "লাইভ AI টেস্ট কনসোল | ChatTime AI",
  description: "আপনার AI এজেন্টের সাথে সরাসরি মেসেঞ্জারে চ্যাট করে টেস্ট করুন",
};

export default function PlaygroundPage() {
  return <AIPlayground />;
}

