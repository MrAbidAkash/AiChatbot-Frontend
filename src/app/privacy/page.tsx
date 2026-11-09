"use client";

import React from "react";
import Link from "next/link";
import {
  FaShieldAlt,
  FaLock,
  FaUserSecret,
  FaEnvelope,
  FaFacebook,
  FaChartLine,
} from "react-icons/fa";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaShieldAlt className="text-primary text-2xl" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-muted-foreground mt-2">
              ChatTime AI (Operated by Solvence Labs) • Dhaka, Bangladesh • support@chattimeai.com
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ChatTime AI ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, store,
              and protect your information when you use our AI-powered chatbot
              automation platform.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using ChatTime AI, you agree to the collection and use of
              information in accordance with this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Information We Collect
            </h2>

            <div className="space-y-6">
              <div className="bg-primary/5 rounded-xl p-6">
                <h3 className="font-semibold text-lg text-foreground mb-3 flex items-center">
                  <FaFacebook className="mr-2 text-primary" />
                  Facebook & Instagram Data
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Facebook Page ID and Instagram Business Account ID</li>
                  <li>• Messages and comments received on your pages</li>
                  <li>
                    • User names and profile information from interactions
                  </li>
                  <li>• Conversation history and chat logs</li>
                  <li>
                    • Media files (images, videos) shared in conversations
                  </li>
                </ul>
              </div>

              <div className="bg-success/5 rounded-xl p-6">
                <h3 className="font-semibold text-lg text-foreground mb-3 flex items-center">
                  <FaUserSecret className="mr-2 text-success" />
                  Account Information
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Email address and name for account creation</li>
                  <li>• Business information and contact details</li>
                  <li>• Authentication tokens for platform connections</li>
                  <li>• Usage patterns and preferences</li>
                </ul>
              </div>

              <div className="bg-accent/5 rounded-xl p-6">
                <h3 className="font-semibold text-lg text-foreground mb-3 flex items-center">
                  <FaChartLine className="mr-2 text-accent" />
                  Analytics & Performance Data
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Message response times and success rates</li>
                  <li>• AI model performance metrics</li>
                  <li>• Platform usage statistics</li>
                  <li>• Error logs and system diagnostics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              How We Use Your Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  Core Service Functions
                </h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Process and respond to messages automatically</li>
                  <li>• Train AI models for better responses</li>
                  <li>• Maintain conversation history</li>
                  <li>• Provide analytics and insights</li>
                </ul>
              </div>
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  Service Improvement
                </h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Analyze usage patterns to improve features</li>
                  <li>• Monitor system performance</li>
                  <li>• Develop new capabilities</li>
                  <li>• Provide customer support</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Storage & Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Data Storage & Security
            </h2>
            <div className="bg-linear-to-r from-primary/5 to-accent/5 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center">
                    <FaLock className="mr-2 text-primary" />
                    Security Measures
                  </h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>• End-to-end encryption for data transmission</li>
                    <li>• Encrypted database storage (AES-256)</li>
                    <li>• Regular security audits and penetration testing</li>
                    <li>• Secure authentication with multi-factor options</li>
                    <li>• Role-based access control for our team</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-4">
                    Data Retention
                  </h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>• Conversation data retained for 2 years</li>
                    <li>
                      • Analytics data aggregated and anonymized after 90 days
                    </li>
                    <li>• Deleted user data removed within 30 days</li>
                    <li>• Backup data encrypted and stored securely</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Your Data Rights
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-6 py-2">
                <h3 className="font-semibold text-foreground">
                  Access & Portability
                </h3>
                <p className="text-muted-foreground">
                  Request a copy of all your personal data at any time.
                </p>
              </div>
              <div className="border-l-4 border-success pl-6 py-2">
                <h3 className="font-semibold text-foreground">Correction</h3>
                <p className="text-muted-foreground">
                  Update or correct inaccurate personal information.
                </p>
              </div>
              <div className="border-l-4 border-accent pl-6 py-2">
                <h3 className="font-semibold text-foreground">Deletion</h3>
                <p className="text-muted-foreground">
                  Request permanent deletion of your account and all associated
                  data.
                </p>
              </div>
              <div className="border-l-4 border-warning pl-6 py-2">
                <h3 className="font-semibold text-foreground">Opt-out</h3>
                <p className="text-muted-foreground">
                  Disable data processing for specific features or entirely.
                </p>
              </div>
            </div>
          </section>

          {/* Data Deletion Process */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Data Deletion Process
            </h2>
            <div className="bg-destructive/5 rounded-xl p-8">
              <h3 className="font-semibold text-foreground mb-4">
                How to Delete Your Data
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-destructive font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Email Us
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Send a deletion request to support@chattimeai.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-destructive font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Verify Identity
                    </p>
                    <p className="text-muted-foreground text-sm">
                      We'll verify your identity using your registered email
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-destructive font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Complete Deletion
                    </p>
                    <p className="text-muted-foreground text-sm">
                      All data permanently deleted within 30 days
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-card rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Alternative:</strong> Visit{" "}
                  <Link
                    href="/delete-data"
                    className="text-primary hover:underline"
                  >
                    /delete-data
                  </Link>{" "}
                  for automated deletion requests.
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Third-Party Services
            </h2>
            <p className="text-muted-foreground mb-4">
              We use the following trusted third-party services:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground">
                  Meta Platforms
                </h4>
                <p className="text-sm text-muted-foreground">
                  Facebook & Instagram API integration
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground">
                  Cloud Infrastructure
                </h4>
                <p className="text-sm text-muted-foreground">
                  Secure data hosting and processing
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground">
                  Payment Processors
                </h4>
                <p className="text-sm text-muted-foreground">
                  Secure payment handling
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground">
                  Analytics Services
                </h4>
                <p className="text-sm text-muted-foreground">
                  Usage monitoring and optimization
                </p>
              </div>
            </div>
          </section>

          {/* International Data Transfers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              International Data Transfers
            </h2>
            <p className="text-gray-700">
              As a Bangladesh-based company, we may transfer data
              internationally for service provision. All transfers comply with
              applicable data protection laws and include appropriate safeguards
              such as Standard Contractual Clauses.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <div className="bg-linear-to-r from-primary to-accent rounded-xl p-8 text-foreground">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <FaEnvelope className="mr-2" />
                    Privacy Inquiries
                  </h3>
                  <div className="space-y-2 text-blue-100">
                    <p>Email: support@chattimeai.com</p>
                    <p>Response Time: Within 48 hours</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Business Information
                  </h3>
                  <div className="space-y-2 text-blue-100">
                    <p>ChatTime AI</p>
                    <p>Dhaka, Bangladesh</p>
                    <p>Trade License: [Your License Number]</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Policy Updates */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Policy Updates
            </h2>
            <p className="text-gray-700">
              We may update this Privacy Policy occasionally. We'll notify you
              of significant changes via email or prominent website notice.
              Continued use of our service indicates acceptance of the updated
              policy.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
