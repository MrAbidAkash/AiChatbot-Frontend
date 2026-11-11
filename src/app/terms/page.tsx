"use client";

import React from "react";
import Link from "next/link";
import { FaFileContract, FaShieldAlt, FaGavel } from "react-icons/fa";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function TermsEN() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaFileContract className="text-primary text-2xl" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-muted-foreground mt-2">
              ChatTime AI (Operated by Solvence Labs) • Dhaka, Bangladesh • support@chattimeai.com
            </p>
          </div>

          {/* Agreement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By using ChatTime AI, you agree to these terms and conditions. If
              you do not agree, please do not use our services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              These terms apply to all users, including customers, businesses,
              contributors, and any other parties.
            </p>
          </section>

          {/* Service Description */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Service Description
            </h2>
            <div className="bg-primary/5 p-6 rounded-xl">
              <p className="text-muted-foreground mb-4">
                ChatTime AI is an AI-based chatbot and automation platform
                providing:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Facebook & Instagram message automation</li>
                <li>• AI-powered customer support</li>
                <li>• Google Workspace integration (Google Drive, Docs, and Sheets live inventory sync)</li>
                <li>• Message analytics and reporting</li>
                <li>• Multi-platform social media management</li>
                <li>• Custom AI training and content control</li>
              </ul>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              User Responsibilities
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="font-semibold text-foreground mb-2 flex items-center">
                  <FaGavel className="mr-2 text-destructive" />
                  Legal Compliance
                </h3>
                <p className="text-muted-foreground">
                  Users must comply with Bangladeshi law and Facebook/Instagram
                  platform policies and data protection rules.
                </p>
              </div>
              <div className="border-l-4 border-warning pl-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Account Security
                </h3>
                <p className="text-muted-foreground">
                  Users are responsible for maintaining the security of their
                  accounts and all activity under it.
                </p>
              </div>
              <div className="border-l-4 border-yellow-500/50 pl-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Content Responsibility
                </h3>
                <p className="text-muted-foreground">
                  Users are responsible for AI-generated content, automated
                  responses, and all communications sent through the platform.
                </p>
              </div>
              <div className="border-l-4 border-success pl-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Platform Rules
                </h3>
                <p className="text-muted-foreground">
                  Users must follow Facebook, Instagram, and other platform
                  rules while using our services.
                </p>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Acceptable Use
            </h2>
            <div className="bg-linear-to-r from-destructive/5 to-warning/5 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Prohibited Activities</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Content Restrictions</h4>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    <li>• Spam or unauthorized messages</li>
                    <li>• False or misleading information</li>
                    <li>• Harassment or abusive content</li>
                    <li>• Illegal activities</li>
                    <li>• Copyright infringement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Technical Restrictions</h4>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    <li>• Reverse engineering the service</li>
                    <li>• Bypassing rate limits</li>
                    <li>• Disrupting the service</li>
                    <li>• Excessive automated scripts</li>
                    <li>• Exploiting security vulnerabilities</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Payment Terms
            </h2>
            <div className="bg-success/5 rounded-xl p-6">
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Free Trial: 14 days, no credit card required</li>
                <li>• Monthly Subscription: auto-renews</li>
                <li>• Annual Subscription: 20% discount, auto-renews</li>
                <li>• Enterprise: custom pricing and terms</li>
              </ul>
            </div>
          </section>

          {/* Google Workspace & Third-Party Integrations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Google Workspace & Cloud Integrations
            </h2>
            <div className="bg-muted p-6 rounded-xl space-y-3 text-muted-foreground text-sm">
              <p>
                ChatTime AI allows merchants to connect their Google accounts to import business knowledge from Google Drive, Google Docs, and Google Sheets.
              </p>
              <ul className="space-y-2 list-disc list-inside pl-1">
                <li><strong>Ownership:</strong> You retain complete ownership of all documents, spreadsheets, and files stored in your Google account. ChatTime AI does not claim any intellectual property rights over your files.</li>
                <li><strong>Access Control:</strong> Our system accesses only the documents and spreadsheets you explicitly choose to index for your AI assistant.</li>
                <li><strong>Automated Stock Adjustments:</strong> If you connect a Google Sheet containing inventory data, you authorize our automated system to decrement product stock cells in your sheet when a customer confirms a valid purchase order on Messenger.</li>
                <li><strong>Compliance with Google Policies:</strong> Our integration strictly complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</li>
                <li><strong>Disconnection:</strong> You may revoke or disconnect Google Workspace access at any time through your dashboard or via your Google Account security settings.</li>
              </ul>
            </div>
          </section>

          {/* Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Privacy & Data Protection
            </h2>
            <div className="bg-linear-to-r from-primary/5 to-accent/5 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FaShieldAlt className="text-primary text-2xl mr-3" />
                <h3 className="font-semibold text-foreground">
                  Privacy Commitment
                </h3>
              </div>
              <p className="text-muted-foreground">
                We take user data protection seriously. Please see our{" "}
                <Link href="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>{" "}
                for detailed information.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Governing Law
            </h2>
            <p className="text-muted-foreground">
              These Terms & Conditions shall be governed by the laws of
              Bangladesh. Any disputes shall be resolved in Dhaka, Bangladesh.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
