import DocumentManager from "@/components/DocumentManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ডকুমেন্টস ও ফাইল আপলোড | ChatTime AI",
  description: "আপনার শপের ক্যাটালগ, পলিসি ও তথ্য ফাইল আপলোড করুন",
};

export default function DocumentsPage() {
  return <DocumentManager />;
}

