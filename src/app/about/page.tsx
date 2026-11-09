"use client";

import React from "react";
import Link from "next/link";
import {
  FaRocket,
  FaUsers,
  FaLightbulb,
  FaShieldAlt,
  FaGlobe,
  FaHeart,
  FaAward,
  FaFlag,
} from "react-icons/fa";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-background/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
            <FaRocket className="text-foreground text-4xl" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-3">
            About ChatTime AI
          </h1>
          <p className="text-sm font-medium uppercase tracking-wider text-blue-200 mb-6">
            A Product of Solvence Labs
          </p>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Empowering businesses worldwide with intelligent conversation
            automation that converts casual chats into loyal customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-background text-primary px-8 py-4 rounded-lg font-semibold hover:bg-card transition"
            >
              Contact Us
            </Link>
            <Link
              href="#"
              className="border-2 border-foreground text-foreground px-8 py-4 rounded-lg font-semibold hover:bg-background/10 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium mb-6">
                <FaFlag className="mr-2" />
                Our Mission
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Transforming Customer Engagement
                <span className="block text-primary">
                  Through AI Innovation
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                At ChatTime AI, we believe every business deserves access to
                powerful customer communication tools. Our mission is to
                democratize AI technology, enabling businesses of all sizes to
                provide exceptional 24/7 customer support without the high costs
                traditionally associated with advanced automation.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <FaHeart className="text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Customer-Centric Approach
                    </h3>
                    <p className="text-muted-foreground">
                      Every feature we build is designed to enhance customer
                      experiences and drive business growth.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <FaLightbulb className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Innovation First
                    </h3>
                    <p className="text-muted-foreground">
                      We continuously push the boundaries of what&apos;s
                      possible with AI and customer communication technology.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-linear-to-br from-primary/5 to-accent/5 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    2,500+
                  </div>
                  <div className="text-muted-foreground">
                    Businesses Trust Us
                  </div>
                </div>
                <div className="bg-card rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-success mb-2">
                    1M+
                  </div>
                  <div className="text-muted-foreground">
                    Conversations Daily
                  </div>
                </div>
                <div className="bg-card rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    99.9%
                  </div>
                  <div className="text-muted-foreground">Uptime Guarantee</div>
                </div>
                <div className="bg-card rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-warning mb-2">5+</div>
                  <div className="text-muted-foreground">Countries Served</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-card px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Our Story
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From a simple idea to a global platform revolutionizing customer
              communication
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-primary/10 rounded-2xl p-8 h-full">
                <div className="text-4xl font-bold text-primary mb-4">2021</div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  The Beginning
                </h3>
                <p className="text-muted-foreground">
                  Founded in Dhaka, Bangladesh, with a simple vision: make
                  AI-powered customer service accessible to every business,
                  regardless of size or budget.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-accent/10 rounded-2xl p-8 h-full">
                <div className="text-4xl font-bold text-accent mb-4">2022</div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Rapid Growth
                </h3>
                <p className="text-muted-foreground">
                  Expanded to serve over 1,000 businesses across 20 countries,
                  introducing advanced AI features and multi-platform support.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-success/10 rounded-2xl p-8 h-full">
                <div className="text-4xl font-bold text-success mb-4">
                  2024+
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Global Impact
                </h3>
                <p className="text-muted-foreground">
                  Now serving thousands of businesses worldwide, continuously
                  innovating and setting new standards in AI customer
                  communication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaShieldAlt className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Trust & Security
              </h3>
              <p className="text-muted-foreground">
                We prioritize data security and privacy in every decision we
                make.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-success text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Customer Success
              </h3>
              <p className="text-muted-foreground">
                Your success is our success. We&apos;re committed to helping you
                thrive.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaLightbulb className="text-accent text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Innovation
              </h3>
              <p className="text-muted-foreground">
                We constantly explore new technologies to improve our service.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaGlobe className="text-warning text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Global Impact
              </h3>
              <p className="text-muted-foreground">
                We believe great technology should be accessible to everyone,
                everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-card px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Passionate individuals dedicated to revolutionizing customer
              communication
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-foreground text-3xl font-bold">
                MR
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Mrabida Khan
              </h3>
              <p className="text-muted-foreground mb-2">Founder & CEO</p>
              <p className="text-sm text-gray-500">
                Visionary leader with 10+ years in AI and customer experience
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-foreground text-3xl font-bold">
                AS
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Ahmed Shah
              </h3>
              <p className="text-muted-foreground mb-2">CTO</p>
              <p className="text-sm text-gray-500">
                AI expert driving our technical innovation and platform
                development
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-foreground text-3xl font-bold">
                FR
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Fatima Rahman
              </h3>
              <p className="text-muted-foreground mb-2">Head of Product</p>
              <p className="text-sm text-gray-500">
                User experience champion ensuring our products delight customers
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-foreground text-3xl font-bold">
                KH
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Karim Hassan
              </h3>
              <p className="text-muted-foreground mb-2">Head of Sales</p>
              <p className="text-sm text-gray-500">
                Growth expert helping businesses succeed with our platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Information */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Business Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Company Details</h3>
                    <div className="space-y-2 text-blue-100">
                      <p>
                        <strong>Legal Name:</strong> ChatTime AI
                      </p>
                      <p>
                        <strong>Registration:</strong> Bangladesh Trade License
                      </p>
                      <p>
                        <strong>License Number:</strong> [Your License Number]
                      </p>
                      <p>
                        <strong>DBID:</strong> [Your Digital Business ID]
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-2 text-blue-100">
                      <p>
                        <strong>Email:</strong> support@chattimeai.com
                      </p>
                      <p>
                        <strong>Business:</strong> business@chattimeai.com
                      </p>
                      <p>
                        <strong>Legal:</strong> legal@chattimeai.com
                      </p>
                      <p>
                        <strong>Location:</strong> Dhaka, Bangladesh
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Certifications & Compliance
                </h2>
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FaAward className="text-2xl" />
                      <div>
                        <h3 className="font-semibold">Meta Business Partner</h3>
                        <p className="text-blue-100 text-sm">
                          Official Meta platform integration partner
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FaShieldAlt className="text-2xl" />
                      <div>
                        <h3 className="font-semibold">GDPR Compliant</h3>
                        <p className="text-blue-100 text-sm">
                          Full compliance with data protection regulations
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FaGlobe className="text-2xl" />
                      <div>
                        <h3 className="font-semibold">ISO 27001 Certified</h3>
                        <p className="text-blue-100 text-sm">
                          Information security management certified
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Customer Communication?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses already using ChatTime AI to automate
            and enhance their customer engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-primary text-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/80 transition"
            >
              Get Started Free
            </Link>
            <Link
              href="#"
              className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-semibold hover:bg-primary/10 transition"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
