"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import AuthGuard from "@/components/auth-guard";
import { useBkash } from "@/hooks/use-bkash";
import {
  CreditCard,
  Smartphone,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

const plans = {
  starter: {
    name: "স্টার্টার প্যাক (Starter)",
    price: 500,
    features: [
      "১,০০০ টি AI মেসেজ রিপ্লাই (৫০ পয়সা/রিপ্লাই)",
      "অটোমেটিক COD অর্ডার কনফার্মেশন",
      "পেজ পোস্ট কমেন্ট অটো-রিপ্লাই",
      "টিম ইনবক্স ও হ্যান্ডওভার",
      "মেয়াদের কোনো সীমাবদ্ধতা নেই (No Expiry)",
    ],
  },
  growth: {
    name: "গ্রোথ প্যাক (Growth - মোস্ট পপুলার)",
    price: 1000,
    features: [
      "২,২০০ টি AI মেসেজ রিপ্লাই (১০% বোনাস সহ)",
      "Vision AI ছবি চিনে প্রোডাক্ট ম্যাচিং",
      "ভয়েস মেসেজ ট্রান্সক্রিপশন",
      "রিয়েল-টাইম টিম ইনবক্স",
      "মেয়াদের কোনো সীমাবদ্ধতা নেই (No Expiry)",
    ],
  },
  business: {
    name: "বিজনেস স্কেল (Business)",
    price: 5000,
    features: [
      "১২,০০০ টি AI মেসেজ রিপ্লাই (২০% বোনাস সহ)",
      "মাল্টি-পেজ কানেকশন",
      "প্রাইওরিটি রেসপন্স ও ডেডিকেটেড সাপোর্ট",
      "মেয়াদের কোনো সীমাবদ্ধতা নেই (No Expiry)",
    ],
  },
  // Backward compatibility alias for professional
  professional: {
    name: "গ্রোথ প্যাক (Growth)",
    price: 1000,
    features: [
      "২,২০০ টি AI মেসেজ রিপ্লাই (১০% বোনাস সহ)",
      "Vision AI ও রিয়েল-টাইম টিম ইনবক্স",
      "মেয়াদের কোনো সীমাবদ্ধতা নেই",
    ],
  },
};

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") as keyof typeof plans;
  const selectedPlan = plans[plan] || plans["starter"];

  const [paymentMethod, setPaymentMethod] = useState<"card" | "bkash">("bkash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    bkashNumber: "",
    email: "",
    name: "",
  });

  useEffect(() => {
    getSession().then((session) => {
      const u = session?.data?.user;
      if (u) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || u.name || "",
          email: prev.email || u.email || "",
        }));
      }
    });
  }, []);

  const {
    createPayment,
    isLoading: isBkashLoading,
    error: bkashError,
  } = useBkash({
    onSuccess: () => {
      setPaymentStatus("processing");
    },
    onError: (error) => {
      setPaymentStatus("error");
      console.error("bKash payment error:", error);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "bkash") {
      // Handle bKash payment
      setIsProcessing(true);
      setPaymentStatus("processing");

      try {
        const callbackURL = `${window.location.origin}/api/bkash/callback`;

        await createPayment({
          // amount: 1,
          amount: selectedPlan.price,
          callbackURL,
          customerInfo: {
            name: formData.name,
            email: formData.email,
          },
        });
      } catch (error) {
        console.error("bKash payment error:", error);
        setPaymentStatus("error");
        setIsProcessing(false);
      }
    } else {
      // Handle card payment (existing logic)
      setIsProcessing(true);
      setPaymentStatus("processing");

      // Simulate payment processing
      setTimeout(() => {
        setPaymentStatus("success");
        setIsProcessing(false);
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          router.push("/checkout/success");
        }, 2000);
      }, 3000);
    }
  };

  const isFormValid = () => {
    if (paymentMethod === "card") {
      return (
        formData.cardNumber.replace(/\s/g, "").length === 16 &&
        formData.cardName.length > 0 &&
        formData.expiryDate.length === 5 &&
        formData.cvv.length === 3 &&
        formData.email.length > 0 &&
        formData.name.length > 0
      );
    } else {
      // For bKash, only require name and email since phone input is commented out
      return formData.email.length > 0 && formData.name.length > 0;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <button
                onClick={() => router.push("/pricing")}
                className="hover:text-foreground"
              >
                Pricing
              </button>
              <span>/</span>
              <span className="text-foreground">Checkout</span>
            </nav>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit}>
                {/* Payment Status Alert */}
                {paymentStatus === "processing" && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Processing your payment securely...
                    </AlertDescription>
                  </Alert>
                )}

                {paymentStatus === "success" && (
                  <Alert className="border-green-500/30 bg-green-500/10 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment successful! Redirecting to confirmation page...
                    </AlertDescription>
                  </Alert>
                )}

                {paymentStatus === "error" && (
                  <Alert className="border-red-500/30 bg-red-500/10 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {bkashError ||
                        "Payment failed. Please try again or contact support."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="John Doe"
                          disabled={isProcessing}
                          className="mt-1.5 border border-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          placeholder="john@example.com"
                          disabled={isProcessing}
                          className="mt-1.5 border border-border"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) =>
                        setPaymentMethod(value as "bkash" | "card")
                      }
                      disabled={isProcessing || isBkashLoading}
                    >
                      <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                        <RadioGroupItem value="bkash" id="bkash" />
                        <Label
                          htmlFor="bkash"
                          className="flex items-center space-x-3 cursor-pointer flex-1"
                        >
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <p className="font-medium">bKash</p>
                            <p className="text-sm text-muted-foreground">
                              Pay with bKash mobile banking
                            </p>
                          </div>
                          <Badge variant="default" className="ml-auto">
                            Popular
                          </Badge>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 rounded-lg border p-4 opacity-60">
                        <RadioGroupItem value="card" id="card" disabled />
                        <Label
                          htmlFor="card"
                          className="flex items-center space-x-3 cursor-pointer flex-1"
                        >
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Credit/Debit Card</p>
                            <p className="text-sm text-muted-foreground">
                              Pay securely with your card
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-auto">
                            Coming Soon
                          </Badge>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Card Payment Form */}
                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            value={formatCardNumber(formData.cardNumber)}
                            onChange={(e) =>
                              handleInputChange(
                                "cardNumber",
                                formatCardNumber(e.target.value),
                              )
                            }
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            disabled={isProcessing}
                            className="mt-1.5 border border-border"
                          />
                        </div>

                        <div>
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input
                            id="cardName"
                            value={formData.cardName}
                            onChange={(e) =>
                              handleInputChange("cardName", e.target.value)
                            }
                            placeholder="John Doe"
                            disabled={isProcessing}
                            className="mt-1.5 border border-border"
                          />
                        </div>

                        <div className="grid gap-4 grid-cols-2">
                          <div>
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              value={formatExpiryDate(formData.expiryDate)}
                              onChange={(e) =>
                                handleInputChange(
                                  "expiryDate",
                                  formatExpiryDate(e.target.value),
                                )
                              }
                              placeholder="MM/YY"
                              maxLength={5}
                              disabled={isProcessing}
                              className="mt-1.5 border border-border"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              value={formData.cvv}
                              onChange={(e) =>
                                handleInputChange(
                                  "cvv",
                                  e.target.value.replace(/[^0-9]/g, ""),
                                )
                              }
                              placeholder="123"
                              maxLength={3}
                              disabled={isProcessing}
                              className="mt-1.5 border border-border"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* bKash Payment Form */}
                    {paymentMethod === "bkash" && (
                      <div className="space-y-4">
                        {/* <div>
                          <Label htmlFor="bkashNumber">
                            bKash Account Number
                          </Label>
                          <Input
                            id="bkashNumber"
                            value={formData.bkashNumber}
                            onChange={(e) =>
                              handleInputChange(
                                "bkashNumber",
                                e.target.value.replace(/[^0-9]/g, ""),
                              )
                            }
                            placeholder="01XXXXXXXXX"
                            maxLength={11}
                            disabled={isProcessing || isBkashLoading}
                            className="mt-1.5 border border-border"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter your 11-digit bKash account number
                          </p>
                        </div> */}

                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Smartphone className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-900 dark:text-blue-100">
                                bKash Payment Process
                              </p>
                              <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                                <li>
                                  • Click &quot;Pay with bKash&quot; to initiate
                                  payment
                                </li>
                                <li>
                                  • You&apos;ll be redirected to bKash payment
                                  page
                                </li>
                                <li>
                                  • Enter your bKash PIN to complete payment
                                </li>
                                <li>
                                  • You&apos;ll be returned here after payment
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Buttons */}
                <div className="space-y-3">
                  {/* bKash Payment Button */}
                  {paymentMethod === "bkash" && (
                    <Button
                      type="button"
                      className="w-full h-12 text-base bg-pink-600 hover:bg-pink-700"
                      disabled={isProcessing || isBkashLoading}
                      onClick={handleSubmit}
                    >
                      {isProcessing || isBkashLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Initiating bKash Payment...
                        </>
                      ) : (
                        <>
                          Pay ৳{selectedPlan.price.toLocaleString()} with bKash
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Card Payment Button */}
                  {paymentMethod === "card" && (
                    <Button
                      type="button"
                      className="w-full h-12 text-base"
                      disabled={!isFormValid() || isProcessing}
                      onClick={handleSubmit}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ৳{selectedPlan.price.toLocaleString()}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Plan Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedPlan.name} Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    ৳{selectedPlan.price.toLocaleString()}
                    <span className="text-lg font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>{selectedPlan.name} Plan</span>
                    <span>৳{selectedPlan.price.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{selectedPlan.price.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (0%)</span>
                    <span>৳0</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>৳{selectedPlan.price.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Badge */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Secure payment powered by SSL encryption</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                    <Lock className="h-4 w-4" />
                    <span>Your payment information is safe and secure</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
