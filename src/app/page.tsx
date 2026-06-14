"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowUpRight,
  Shield,
  Layers,
  ChevronDown,
  Mail,
  CheckCircle,
  HelpCircle,
  Menu,
  X
} from "lucide-react";

// Mock Market Data (US/Global indices)
const companies = [
  { name: "Manchester United Plc", symbol: "MANU", price: "$23.21", change: "-0.8%", positive: false },
  { name: "Microsoft Corporation", symbol: "MSFT", price: "$390.74", change: "-1.1%", positive: false },
  { name: "Mastercard Inc", symbol: "MA", price: "$489.98", change: "+0.4%", positive: true },
  { name: "Lowe’s Companies Inc", symbol: "LOW", price: "$221.05", change: "+0.8%", positive: true },
  { name: "American Airlines Group Inc", symbol: "AAL", price: "$14.98", change: "-2.4%", positive: false },
  { name: "Amazon.com Inc", symbol: "AMZN", price: "$238.55", change: "+1.2%", positive: true },
  { name: "Alibaba Group", symbol: "BABA", price: "$112.82", change: "-1.8%", positive: false },
  { name: "Tesla, Inc", symbol: "TSLA", price: "$406.43", change: "+3.1%", positive: true },
  { name: "Nokia Corp", symbol: "NOK", price: "$14.80", change: "+5.5%", positive: true },
  { name: "Bank of America Corp", symbol: "BAC", price: "$56.02", change: "+1.1%", positive: true },
  { name: "United Therapeutics Corporation", symbol: "UTHR", price: "$553.14", change: "-0.5%", positive: false },
  { name: "Citigroup Inc", symbol: "C", price: "$139.83", change: "+5.6%", positive: true },
];

const plans = [
  {
    name: "Standard Alpha",
    min: "$100",
    max: "$4,999",
    desc: "Entry-level plan designed for steady, diversified returns. Perfect for matching individual savings targets.",
    color: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/30"
  },
  {
    name: "Premium Growth",
    min: "$5,000",
    max: "$24,999",
    desc: "Optimized mid-tier asset selection targeting high-yielding venture parameters and real estate instruments.",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30"
  },
  {
    name: "Vanguard Select",
    min: "$25,000",
    max: "$1,000,000",
    desc: "Elite tier private equity fund allocations custom tailored for high-net-worth institutional wealth profiles.",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30"
  }
];

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Senior Financial Analyst",
    text: "Vestriq completely changed how I allocate capital. The admin performance tracking updates keep my holdings secure and completely clear."
  },
  {
    name: "David Miller",
    role: "Tech Entrepreneur",
    text: "I love the premium feel of the platform. Making deposits and tracking my portfolio adjustments is incredibly smooth."
  },
  {
    name: "Marcus Thompson",
    role: "Real Estate Developer",
    text: "Having dedicated wallet destinations and institutional-grade analytics makes Vestriq feel like a private bank dashboard."
  }
];

const faqs = [
  {
    q: "Is Vestriq a guaranteed fixed returns platform?",
    a: "No. Vestriq is an active, expert-managed investment portal. Portfolio values fluctuate based on market movements. Performance updates and adjustments are logged transparently by administrators."
  },
  {
    q: "How long do withdrawals take to process?",
    a: "Withdrawal requests are processed securely and credited to your designated crypto destination address within 48 hours."
  },
  {
    q: "How do I make a deposit?",
    a: "Select an investment plan, specify your amount, and follow the transaction instructions to transfer crypto funds to the secure admin wallet. Once payment is validated, your investment is activated."
  },
  {
    q: "What is the minimum investment requirement?",
    a: "You can start investing in the Standard Alpha plan with a minimum of $100."
  }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* BACKGROUND GRADIENTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-950/20 via-slate-950/0 to-slate-950/0 pointer-events-none z-0 blur-3xl" />
      <div className="absolute top-80 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[1200px] left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-indigo-400 w-6 h-6" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Vestriq
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#market" className="hover:text-white transition-colors">Market</a>
            <a href="#plans" className="hover:text-white transition-colors">Investment Plans</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-indigo-400 transition-colors px-4 py-2">
              Login
            </Link>
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-slate-950 z-50 flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Vestriq
              </span>
              <button className="text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-6 text-lg text-slate-300 font-medium mb-12">
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">About</a>
              <a href="#market" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Market</a>
              <a href="#plans" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Investment Plans</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">FAQ</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Contact</a>
            </div>

            <div className="flex flex-col gap-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center border border-slate-800 py-3 rounded-xl hover:bg-slate-900 transition-colors">
                Login
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center bg-indigo-600 py-3 rounded-xl hover:bg-indigo-500 transition-all">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 px-6 max-w-7xl mx-auto z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 inline-block">
            Next-Gen Portfolio Management
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight md:leading-none">
            Intelligent Wealth Management <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Built for Modern Investors
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-6">
            A premium institutional-grade investment gateway giving you complete control over diversified digital portfolios. No fixed return gimmicks—just verified active manager growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/register" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2">
              Start Investing <ArrowUpRight className="w-5 h-5" />
            </Link>
            <a href="#plans" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-8 py-4 rounded-xl transition-colors inline-block">
              View Plans
            </a>
          </div>
        </motion.div>

        {/* HERO STATISTICS */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-24 bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-8 shadow-xl"
        >
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">$28.4M</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-2 font-semibold">Assets Under Management</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">14,200+</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-2 font-semibold">Active Investors</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-emerald-400 bg-clip-text text-transparent">99.8%</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-2 font-semibold">Funding Success</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">&lt;48h</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-2 font-semibold">Withdrawal Payouts</p>
          </div>
        </motion.div>
      </section>

      {/* WHY CHOOSE VESTRIQ */}
      <section id="about" className="py-24 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose Vestriq?</h2>
          <p className="text-slate-400 text-sm mt-3">An elite operational system engineered for security and transparency.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 hover:border-slate-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
              <Shield className="text-indigo-400 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Secure Infrastructure</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              We leverage cryptographic funding addresses, role segregation, and HTTP-only JWT verification to safeguard user transactional profiles.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 hover:border-slate-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Layers className="text-purple-400 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Active Performance Updates</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              No hardcoded profit rates. Portfolio changes are made by active asset administrators, reflected directly on user charts and audit histories.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 hover:border-slate-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
              <TrendingUp className="text-emerald-400 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Interactive Analytics</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Log in to view growth charts, investment trends, detailed account activity widgets, and notification streams.
            </p>
          </motion.div>
        </div>
      </section>

      {/* MARKET OVERVIEW */}
      <section id="market" className="py-24 bg-slate-900/20 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold">Market Overview</h2>
              <p className="text-slate-400 text-sm mt-2">Active tracking parameters across leading global equities.</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
              <span>Real-Time Indexes</span> <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {companies.map((c, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="bg-slate-900/50 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-md relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-300">{c.symbol}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[120px]">{c.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {c.change}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-2">{c.price}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTMENT PLANS */}
      <section id="plans" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Optimized Investment Plans</h2>
          <p className="text-slate-400 text-sm mt-3">Choose the asset management container that matches your capital targets.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className={`bg-gradient-to-b ${p.color} border ${p.border} rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden`}
            >
              <div>
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <p className="text-xs text-slate-400 mb-6">{p.desc}</p>
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Min Investment:</span>
                    <span className="font-bold">{p.min}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Max Investment:</span>
                    <span className="font-bold">{p.max}</span>
                  </div>
                </div>
              </div>
              <Link href="/register" className="w-full bg-white text-slate-950 font-semibold py-3 rounded-xl hover:bg-slate-100 transition-colors text-center block text-sm">
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">How Vestriq Works</h2>
            <p className="text-slate-400 text-sm mt-3">Start accumulating returns in three transparent steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg mb-6 shadow-lg shadow-indigo-600/30">
                1
              </div>
              <h4 className="font-bold text-lg">Create Account</h4>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Register with your email and set up validation details. Authentication is guarded by JWT and secure cookies.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg mb-6 shadow-lg shadow-purple-600/30">
                2
              </div>
              <h4 className="font-bold text-lg">Transmit Funds</h4>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Select an investment plan, copy the secure admin wallet destination, and confirm deposit. Once approved, your portfolio begins.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-lg mb-6 shadow-lg shadow-emerald-600/30">
                3
              </div>
              <h4 className="font-bold text-lg">Monitor Performance</h4>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Track active adjustments, yield records, and notifications directly from your personalized dashboard interface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Trusted by Thousands</h2>
          <p className="text-slate-400 text-sm mt-3">Hear from active investors scaling their financial allocations with Vestriq.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 relative">
              <p className="text-slate-300 text-sm italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h5 className="font-bold text-sm">{t.name}</h5>
                  <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm mt-3">Everything you need to know about the Vestriq wealth ecosystem.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden">
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-sm hover:bg-slate-900/20 transition-colors"
                  onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                    {f.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${faqOpenIndex === i ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {faqOpenIndex === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 pt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-900">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-6 max-w-xl mx-auto z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Get in Touch</h2>
          <p className="text-slate-400 text-sm mt-3">Have questions about corporate investing? Drop us a line.</p>
        </div>

        {contactSuccess ? (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h4 className="font-bold text-lg">Message Sent Successfully</h4>
            <p className="text-slate-400 text-xs mt-2">Our support personnel will reach out to you within 24 hours.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setContactSuccess(true);
            }}
            className="space-y-5 bg-slate-900/60 backdrop-blur-xl border border-slate-900 rounded-3xl p-8 shadow-xl"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Name</label>
              <input type="text" required className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" required className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Message</label>
              <textarea required rows={4} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="Hello, I'd like to ask about..." />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
              Send Message <Mail className="w-4 h-4" />
            </button>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-indigo-400 w-5 h-5" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Vestriq
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Premium wealth management frameworks for modern investors. Fully integrated dynamic adjustments, auditable histories, and secure payment gates.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-4">Links</h5>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500">
              <a href="#about" className="hover:text-slate-300 transition-colors">About Us</a>
              <a href="#market" className="hover:text-slate-300 transition-colors">Market overview</a>
              <a href="#plans" className="hover:text-slate-300 transition-colors">Investment Plans</a>
            </div>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-4">Security</h5>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500">
              <span className="hover:text-slate-300 transition-colors cursor-pointer">JWT & Cookie safety</span>
              <span className="hover:text-slate-300 transition-colors cursor-pointer">Segregated wallets</span>
              <span className="hover:text-slate-300 transition-colors cursor-pointer">RBAC levels</span>
            </div>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-4">Risk Warning</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Investments are subject to market volatility. Vestriq does not guarantee fixed percentages of capital increment. Perform due research before transferring holdings.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900/60 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <span>&copy; 2026 Vestriq Technologies. All rights reserved.</span>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
