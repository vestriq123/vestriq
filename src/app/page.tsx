"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ArrowUpRight, Shield, Layers, ChevronDown, Mail, CheckCircle, HelpCircle, Menu, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { StatTile } from "@/components/ui/StatTile";
import { cn } from "@/lib/cn";

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
    min: "$299",
    max: "$4,999",
    desc: "Entry-level plan designed for steady, diversified returns. Perfect for matching individual savings targets.",
  },
  {
    name: "Premium Growth",
    min: "$5,000",
    max: "$24,999",
    desc: "Optimized mid-tier asset selection targeting high-yielding venture parameters and real estate instruments.",
  },
  {
    name: "Vanguard Select",
    min: "$25,000",
    max: "$50,000",
    desc: "Elite tier private equity fund allocations custom tailored for high-net-worth institutional wealth profiles.",
  },
  {
    name: "Apex Sovereign",
    min: "$50,000",
    max: "$100,000",
    desc: "Ultimate wealth growth container with institutional backing and strict lockup optimization.",
  },
];

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Senior Financial Analyst",
    text: "Vestriq completely changed how I allocate capital. The admin performance tracking updates keep my holdings secure and completely clear.",
  },
  {
    name: "David Miller",
    role: "Tech Entrepreneur",
    text: "I love the premium feel of the platform. Making deposits and tracking my portfolio adjustments is incredibly smooth.",
  },
  {
    name: "Marcus Thompson",
    role: "Real Estate Developer",
    text: "Having dedicated wallet destinations and institutional-grade analytics makes Vestriq feel like a private bank dashboard.",
  },
];

const faqs = [
  {
    q: "Is Vestriq a guaranteed fixed returns platform?",
    a: "No. Vestriq is an active, expert-managed investment portal. Portfolio values fluctuate based on market movements. Performance updates and adjustments are logged transparently by administrators.",
  },
  {
    q: "How long do withdrawals take to process?",
    a: "Withdrawal requests are processed securely and credited to your designated crypto destination address within 48 hours.",
  },
  {
    q: "How do I make a deposit?",
    a: "Select an investment plan, specify your amount, and follow the transaction instructions to transfer crypto funds to the secure admin wallet. Once payment is validated, your investment is activated.",
  },
  {
    q: "What is the minimum investment requirement?",
    a: "You can start investing in the Standard Alpha plan with a minimum of $100.",
  },
];

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#market", label: "Market" },
  { href: "#plans", label: "Investment Plans" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState("");

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit contact message.");
      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setContactSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated) setIsAuthenticated(true);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleTileClick = () => {
    router.push(isAuthenticated ? "/dashboard/deposit" : "/login?redirectTo=/dashboard/deposit");
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[560px] bg-gradient-to-b from-brand-700/15 via-transparent to-transparent pointer-events-none z-0 blur-3xl" />

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full bg-surface-0/85 backdrop-blur-md border-b border-border-subtle z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-brand-400 w-6 h-6" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">Vestriq</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary font-medium">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-text-primary transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ButtonLink href="/login" variant="ghost" size="sm">
              Login
            </ButtonLink>
            <ButtonLink href="/register" size="sm">
              Get Started
            </ButtonLink>
          </div>

          <button className="md:hidden text-text-secondary hover:text-text-primary" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
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
            className="fixed inset-0 bg-surface-0 z-50 flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">Vestriq</span>
              <button className="text-text-secondary hover:text-text-primary" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-6 text-lg text-text-secondary font-medium mb-12">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="hover:text-text-primary">
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <ButtonLink href="/login" variant="outline" onClick={() => setMobileMenuOpen(false)} fullWidth>
                Login
              </ButtonLink>
              <ButtonLink href="/register" onClick={() => setMobileMenuOpen(false)} fullWidth>
                Get Started
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="relative pt-36 pb-20 px-6 max-w-7xl mx-auto z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6 inline-block">
            Next-Gen Portfolio Management
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight md:leading-[1.05] text-text-primary">
            Intelligent Wealth Management <br />
            <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent bg-clip-text text-transparent">Built for Modern Investors</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mt-6">
            A premium institutional-grade investment gateway giving you complete control over diversified digital portfolios. No fixed return
            gimmicks&mdash;just verified active manager growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <ButtonLink href="/register" size="lg" rightIcon={<ArrowUpRight className="w-5 h-5" />}>
              Start Investing
            </ButtonLink>
            <ButtonLink href="#plans" size="lg" variant="secondary">
              View Plans
            </ButtonLink>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-24"
        >
          <StatTile label="Assets Under Management" value="$28.4M" tone="brand" />
          <StatTile label="Active Investors" value="14,200+" tone="brand" />
          <StatTile label="Funding Success" value="99.8%" tone="profit" />
          <StatTile label="Withdrawal Payouts" value="<48h" tone="profit" />
        </motion.div>
      </section>

      {/* WHY CHOOSE VESTRIQ */}
      <section id="about" className="py-24 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Why Choose Vestriq?</h2>
          <p className="text-text-muted text-sm mt-3">An elite operational system engineered for security and transparency.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, tone: "text-brand-400 bg-brand-500/10", title: "Secure Infrastructure", desc: "We leverage cryptographic funding addresses, role segregation, and HTTP-only JWT verification to safeguard user transactional profiles." },
            { icon: Layers, tone: "text-accent bg-accent/10", title: "Active Performance Updates", desc: "No hardcoded profit rates. Portfolio changes are made by active asset administrators, reflected directly on user charts and audit histories." },
            { icon: TrendingUp, tone: "text-profit bg-profit/10", title: "Interactive Analytics", desc: "Log in to view growth charts, investment trends, detailed account activity widgets, and notification streams." },
          ].map((f, i) => (
            <motion.div key={i} whileHover={{ y: -4 }}>
              <Card hover>
                <CardBody>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", f.tone)}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">{f.title}</h3>
                  <p className="text-text-muted text-sm mt-3 leading-relaxed">{f.desc}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MARKET OVERVIEW */}
      <section id="market" className="py-24 bg-surface-1/40 border-y border-border-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">Market Overview</h2>
              <p className="text-text-muted text-sm mt-2">Active tracking parameters across leading global equities.</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs text-brand-400 font-semibold uppercase tracking-wider">
              <span>Real-Time Indexes</span> <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {companies.map((c, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} onClick={handleTileClick} className="cursor-pointer">
                <Card hover className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-secondary">{c.symbol}</h4>
                      <p className="text-xs text-text-muted truncate max-w-[120px]">{c.name}</p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", c.positive ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss")}>
                      {c.change}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mt-2 text-text-primary tabular-nums">{c.price}</h3>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTMENT PLANS */}
      <section id="plans" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Optimized Investment Plans</h2>
          <p className="text-text-muted text-sm mt-3">Choose the asset management container that matches your capital targets.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <motion.div key={i} whileHover={{ y: -4 }}>
              <Card hover className="flex flex-col h-full">
                <CardBody className="flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 text-text-primary">{p.name}</h3>
                  <p className="text-xs text-text-muted mb-6 flex-1 leading-relaxed">{p.desc}</p>
                  <div className="space-y-2 mb-8 bg-surface-1 border border-border-subtle rounded-xl p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Min Investment:</span>
                      <span className="font-bold text-text-primary">{p.min}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Max Investment:</span>
                      <span className="font-bold text-text-primary">{p.max}</span>
                    </div>
                  </div>
                  <ButtonLink href="/register" fullWidth>
                    Get Started
                  </ButtonLink>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-surface-1/30 border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary">How Vestriq Works</h2>
            <p className="text-text-muted text-sm mt-3">Start accumulating returns in three transparent steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: 1, tone: "bg-brand-600 shadow-brand-600/30", title: "Create Account", desc: "Register with your email and set up validation details. Authentication is guarded by JWT and secure cookies." },
              { step: 2, tone: "bg-accent/90 shadow-accent/30", title: "Transmit Funds", desc: "Select an investment plan, copy the secure admin wallet destination, and confirm deposit. Once approved, your portfolio begins." },
              { step: 3, tone: "bg-profit shadow-profit/30", title: "Monitor Performance", desc: "Track active adjustments, yield records, and notifications directly from your personalized dashboard interface." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-6 text-surface-0 shadow-lg", s.tone)}>{s.step}</div>
                <h4 className="font-bold text-lg text-text-primary">{s.title}</h4>
                <p className="text-text-muted text-sm mt-3 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary">Trusted by Thousands</h2>
          <p className="text-text-muted text-sm mt-3">Hear from active investors scaling their financial allocations with Vestriq.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i}>
              <CardBody>
                <p className="text-text-secondary text-sm italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-300 font-bold text-xs uppercase shrink-0">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-text-primary">{t.name}</h5>
                    <p className="text-xs text-text-muted mt-0.5">{t.role}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-surface-1/30 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary">Frequently Asked Questions</h2>
            <p className="text-text-muted text-sm mt-3">Everything you need to know about the Vestriq wealth ecosystem.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-sm hover:bg-surface-1/60 transition-colors text-text-primary"
                  onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-brand-400 shrink-0" />
                    {f.q}
                  </span>
                  <ChevronDown className={cn("w-5 h-5 text-text-muted transition-transform shrink-0", faqOpenIndex === i && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {faqOpenIndex === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <p className="px-6 pb-6 pt-2 text-xs text-text-muted leading-relaxed border-t border-border-subtle">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-6 max-w-xl mx-auto z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary">Get in Touch</h2>
          <p className="text-text-muted text-sm mt-3">
            Have questions about corporate investing? Drop us a line. You can also email us at{" "}
            <a href="mailto:support@vestriqinvest.com" className="text-brand-400 hover:text-brand-300 underline transition-colors">
              support@vestriqinvest.com
            </a>
          </p>
        </div>

        {contactSuccess ? (
          <Card className="text-center p-8">
            <CheckCircle className="w-12 h-12 text-profit mx-auto mb-4" />
            <h4 className="font-bold text-lg text-text-primary">Message Sent Successfully</h4>
            <p className="text-text-muted text-xs mt-2">Our support personnel will reach out to you within 24 hours.</p>
          </Card>
        ) : (
          <form onSubmit={handleContactSubmit}>
            <Card>
              <CardBody className="space-y-5">
                {contactError && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl">{contactError}</div>}
                <Input label="Name" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Doe" />
                <Input
                  type="email"
                  label="Email Address"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="john@example.com"
                />
                <Textarea
                  label="Message"
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Hello, I'd like to ask about..."
                />
                <Button type="submit" isLoading={contactSubmitting} fullWidth rightIcon={<Mail className="w-4 h-4" />}>
                  {contactSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </CardBody>
            </Card>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-surface-0 border-t border-border-subtle py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-brand-400 w-5 h-5" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">Vestriq</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Premium wealth management frameworks for modern investors. Fully integrated dynamic adjustments, auditable histories, and secure
              payment gates.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider text-text-secondary mb-4">Links</h5>
            <div className="flex flex-col gap-2.5 text-xs text-text-muted">
              <a href="#about" className="hover:text-text-secondary transition-colors">About Us</a>
              <a href="#market" className="hover:text-text-secondary transition-colors">Market overview</a>
              <a href="#plans" className="hover:text-text-secondary transition-colors">Investment Plans</a>
            </div>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider text-text-secondary mb-4">Security</h5>
            <div className="flex flex-col gap-2.5 text-xs text-text-muted">
              <span>JWT & Cookie safety</span>
              <span>Segregated wallets</span>
              <span>RBAC levels</span>
            </div>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider text-text-secondary mb-4">Risk Warning</h5>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Investments are subject to market volatility. Vestriq does not guarantee fixed percentages of capital increment. Perform due research
              before transferring holdings.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between text-xs text-text-muted">
          <span>&copy;2026 All rights reserved.</span>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
