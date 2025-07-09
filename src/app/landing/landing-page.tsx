'use client';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/components/ui/sheet';
import { 
  Scissors, 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Play,
  Quote,
  Award,
  Zap,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [averageMonthlyAmount, setAverageMonthlyAmount] = useState("5000");
  const [cutCost, setCutCost] = useState("50");
  const [numberOfCuts, setNumberOfCuts] = useState(100);
  const [platformFeeBonus, setPlatformFeeBonus] = useState(135);
  const [extraAnnual, setExtraAnnual] = useState(1620);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerState, setHeaderState] = useState<'default' | 'scrolled' | 'hidden'>('default');

  const updateCalculator = () => {
    const monthlyAmount = parseFloat(averageMonthlyAmount) || 5000;
    const servicePrice = parseFloat(cutCost) || 50;
    const cuts = Math.round(monthlyAmount / servicePrice);
    const bonus = cuts * 1.35;
    const annual = bonus * 12;
    setNumberOfCuts(cuts);
    setPlatformFeeBonus(bonus);
    setExtraAnnual(annual);
  };

  useEffect(() => {
    updateCalculator();
  }, [averageMonthlyAmount, cutCost]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200 ) {
        setHeaderState('hidden');
      } else if (window.scrollY > 0) {
        setHeaderState('scrolled');
      } else {
        setHeaderState('default');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);
    try {
      const res = await fetch("/api/send-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send email");
      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError("Failed to send. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const testimonials = [
    {
      name: "Chance Robenson",
      role: "Master Barber",
      location: "Princeton, NJ",
      revenue: "$50K/year",
      image: "/api/placeholder/60/60",
      quote: "BOCM made running my business so much easier. My clients love the booking experience, and I’ve seen my revenue grow every month.",
      rating: 5
    },
    {
      name: "Caleb Bock",
      role: "Barber",
      location: "Blacksburg, VA",
      revenue: "$65K/year",
      image: "/api/placeholder/60/60",
      quote: "Since switching to BOCM, I spend less time on admin and more time with my clients. The reminders and scheduling are a game changer!",
      rating: 5
    }
  ];

  const features = [
    {
      number: "01",
      title: "Smart Booking System",
      description: "Automated scheduling that reduces no-shows by 80% and fills your chair with premium clients.",
      icon: Calendar,
      color: "bg-saffron/20 text-saffron"
    },
    {
      number: "02", 
      title: "Revenue Optimization",
      description: "AI-powered pricing suggestions and service bundling to maximize your earnings per client.",
      icon: DollarSign,
      color: "bg-secondary/20 text-secondary"
    },
    {
      number: "03",
      title: "Client Management",
      description: "Complete client profiles, preferences, and history to deliver personalized experiences.",
      icon: Users,
      color: "bg-saffron/20 text-saffron"
    },
    {
      number: "04",
      title: "Marketing Automation",
      description: "Automated follow-ups, birthday wishes, and rebooking reminders to keep clients coming back.",
      icon: Zap,
      color: "bg-primary/20 text-primary"
    }
  ];

  const mobileNavItems = [
    { href: "#features", label: "Features" },
    { href: "#testimonials", label: "Success Stories" },
    { href: "#calculator", label: "Calculator" },
    { href: "/browse", label: "Browse" },
    { href: "/login", label: "Login" },
    { href: "/register", label: "Get Started" },
  ];

  return (
    <div className="landing-root min-h-screen bg-primary">
      {/* Header with Mobile Menu */}
      <header
        className={`w-full py-3 sm:py-6 px-4 sm:px-6 bg-transparent transition-transform duration-300 ease-in-out z-50
          ${headerState === 'default' ? 'translate-y-0' : ''}
          ${headerState === 'scrolled' ? 'translate-y-2 shadow-lg' : ''}
          ${headerState === 'hidden' ? '-translate-y-full' : ''}
        `}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile: logo + hamburger only */}
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
            <Link href="/" className="text-xl sm:text-2xl font-bebas font-bold text-primary">
              BOCM
            </Link>
            {/* Hamburger menu only on mobile */}
            <div className="md:hidden flex items-center">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-white hover:bg-white/10"
                  >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-darkpurple/95 backdrop-blur-xl border-white/10">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-2xl font-bebas font-bold text-saffron">BOCM</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 text-white hover:bg-white/10"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <nav className="flex-1">
                      <ul className="space-y-4">
                        {mobileNavItems.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="block py-3 px-4 text-white hover:text-saffron hover:bg-white/10 rounded-lg transition-colors text-lg font-medium"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    <div className="pt-8 border-t border-white/10">
                      <Link
                        href="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full px-6 py-3 bg-saffron text-primary rounded-full font-semibold text-center hover:bg-saffron/90 transition-colors"
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          {/* Desktop: nav links + CTAs */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white hover:text-saffron transition-colors">Features</a>
            <a href="#testimonials" className="text-white hover:text-saffron transition-colors">Success Stories</a>
            <a href="#calculator" className="text-white hover:text-saffron transition-colors">Calculator</a>
            <Link href="/browse" className="text-white hover:text-saffron transition-colors">Browse</Link>
            <Link href="/login" className="text-white hover:text-saffron transition-colors">Login</Link>
            <Link 
              href="/register" 
              className="px-6 py-2 bg-saffron text-primary rounded-full font-semibold hover:bg-saffron/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-saffron/20 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bebas font-extrabold text-white leading-tight">
                  Turn Your Practice Into a <span className="text-saffron">$200K+</span> Business
                </h1>
                <p className="text-lg sm:text-xl text-white/90 max-w-xl">
                  The only platform that actually grows your revenue. Book more clients, charge premium rates, build your empire.
                </p>
                <p className="text-base sm:text-lg text-saffron font-semibold">
                  No setup fees. No subscription. 100% free for barbers and clients.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register" 
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-saffron text-primary rounded-full font-semibold text-base sm:text-lg shadow-lg hover:bg-saffron/90 transition-colors text-center"
                >
                  Start Growing Today
                </Link>
                <button className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white rounded-full font-semibold text-base sm:text-lg bg-transparent hover:bg-white/10 transition-colors">
                  <Play className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Watch Real Results
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 sm:gap-6 pt-6 sm:pt-8">
                <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 min-w-[100px] sm:min-w-[120px]">
                  <span className="text-2xl sm:text-3xl font-bebas text-saffron">1000+</span>
                  <span className="text-xs sm:text-sm text-white/80 font-medium">Stylists</span>
                </div>
                <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 min-w-[100px] sm:min-w-[120px]">
                  <span className="text-2xl sm:text-3xl font-bebas text-white">10,000+</span>
                  <span className="text-xs sm:text-sm text-white/80 font-medium">Bookings</span>
                </div>
                <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 min-w-[100px] sm:min-w-[120px]">
                  <span className="text-2xl sm:text-3xl font-bebas text-saffron">4.9/5</span>
                  <span className="text-xs sm:text-sm text-white/80 font-medium">Rating</span>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Demo */}
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-darkpurple/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Revenue Dashboard</h3>
                    <div className="flex items-center text-saffron">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm font-medium">+40%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white/10 rounded-xl p-3 sm:p-4">
                      <p className="text-white/60 text-xs sm:text-sm">Monthly Revenue</p>
                      <p className="text-lg sm:text-2xl font-bold text-white">$12,450</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 sm:p-4">
                      <p className="text-white/60 text-xs sm:text-sm">Bookings</p>
                      <p className="text-lg sm:text-2xl font-bold text-white">127</p>
                    </div>
                  </div>
                  
                  <div className="bg-saffron/20 rounded-xl p-3 sm:p-4">
                    <p className="text-saffron text-xs sm:text-sm font-medium">This Month's Growth</p>
                    <p className="text-lg sm:text-xl font-bold text-saffron">+$3,200</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Calculator Section */}
      <section id="calculator" className="py-16 sm:py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bebas font-bold text-white mb-4">
              The "Holy Sh*t" Moment
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              See exactly how much more you could be earning with BOCM's revenue optimization tools.
            </p>
          </div>

          <div className="bg-darkpurple/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl border border-white/10">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
              {/* Calculator Input */}
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                      Average Monthly Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/60">$</span>
                      <input
                        type="text"
                        value={averageMonthlyAmount}
                        onChange={(e) => setAverageMonthlyAmount(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full pl-6 sm:pl-8 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg sm:text-xl font-semibold placeholder-white/40 focus:outline-none focus:border-saffron"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                      Cut Cost
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/60">$</span>
                      <input
                        type="text"
                        value={cutCost}
                        onChange={(e) => setCutCost(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full pl-6 sm:pl-8 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg sm:text-xl font-semibold placeholder-white/40 focus:outline-none focus:border-saffron"
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 sm:mt-8 text-center">
                  <div className="text-base sm:text-lg text-white/80 mb-2">You do <span className="font-bold text-saffron">{numberOfCuts}</span> cuts per month</div>
                  <div className="text-xl sm:text-2xl font-bold text-saffron mb-2">Platform Fee Bonus: ${platformFeeBonus.toLocaleString(undefined, {maximumFractionDigits: 0})}/month</div>
                  <div className="text-base sm:text-lg text-white/80 mb-4">That's <span className="font-bold text-saffron">${extraAnnual.toLocaleString(undefined, {maximumFractionDigits: 0})}</span> per year in extra income!</div>
                  <div className="bg-secondary/20 rounded-2xl p-4 sm:p-6 border border-secondary/30 inline-block mt-4">
                    <div className="text-white/80 text-xs sm:text-sm mb-1">Breakdown:</div>
                    <div className="text-white text-sm sm:text-base font-semibold">{numberOfCuts} cuts × $1.35 = <span className="text-saffron">${platformFeeBonus.toLocaleString(undefined, {maximumFractionDigits: 0})}</span> per month</div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-saffron/20 rounded-2xl p-4 sm:p-6 border border-saffron/30">
                  <p className="text-saffron text-xs sm:text-sm font-medium mb-2">Total Monthly Revenue</p>
                  <p className="text-3xl sm:text-4xl font-bold text-saffron">${platformFeeBonus.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <p className="text-saffron/80 text-xs sm:text-sm mt-1">Service + Platform Fees (40%)</p>
                </div>
                
                <div className="bg-white/10 rounded-2xl p-4 sm:p-6">
                  <p className="text-white/60 text-xs sm:text-sm mb-2">Extra Annual Income</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">${extraAnnual.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">From platform fees alone</p>
                </div>
                
                <div className="bg-secondary/20 rounded-2xl p-4 sm:p-6 border border-secondary/30">
                  <p className="text-secondary text-xs sm:text-sm font-medium mb-2">Monthly Breakdown</p>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Number of Cuts:</span>
                      <span className="text-white">{numberOfCuts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Platform Fee Bonus:</span>
                      <span className="text-white">${platformFeeBonus.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-saffron text-primary rounded-xl font-semibold text-base sm:text-lg hover:bg-saffron/90 transition-colors">
                  Start Earning More Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bebas font-bold text-white mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto">
              From booking automation to revenue optimization, BOCM gives you the tools to transform your barber business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-bebas text-white/20 group-hover:text-white/30 transition-colors">
                    {feature.number}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bebas font-bold text-white mb-4">
              Real Results from Real Barbers
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto">
              See how barbers across the country are scaling their businesses with BOCM.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-saffron/20 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-saffron font-semibold text-sm sm:text-base">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">{testimonial.name}</h4>
                    <p className="text-white/60 text-xs sm:text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-saffron fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-white/80 mb-4 italic text-sm sm:text-base">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <span className="text-saffron font-semibold text-sm sm:text-base">{testimonial.revenue}</span>
                  <span className="text-white/60 text-xs sm:text-sm">{testimonial.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-saffron/20 to-secondary/20 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-white/10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bebas font-bold text-white mb-4 sm:mb-6">
              Ready to Scale Your Business?
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of barbers who are already earning more with BOCM. 
              Start your free trial today and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-6 sm:px-8 py-3 sm:py-4 bg-saffron text-primary rounded-full font-semibold text-base sm:text-lg shadow-lg hover:bg-saffron/90 transition-colors"
              >
                Start Free Trial
              </Link>
              <button 
                onClick={() => setModalOpen(true)}
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white rounded-full font-semibold text-base sm:text-lg bg-transparent hover:bg-white/10 transition-colors"
              >
                Book a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bebas font-bold text-white mb-4">BOCM</h3>
              <p className="text-white/60 text-sm sm:text-base">
                The platform that transforms barber businesses into empires.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm sm:text-base">
                <li><a href="#" className="hover:text-saffron transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-saffron transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-saffron transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm sm:text-base">
                <li><a href="#" className="hover:text-saffron transition-colors">About</a></li>
                <li><a href="#" className="hover:text-saffron transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-saffron transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-white/60 text-sm sm:text-base">
                <li><a href="#" className="hover:text-saffron transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-saffron transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-saffron transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-white/60 text-sm sm:text-base">
            <p>&copy; 2024 BOCM. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Book Appointment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full rounded-3xl border-none shadow-2xl p-0">
          <DialogDescription className="sr-only">
            Book a demo appointment form
          </DialogDescription>
          <div className="relative flex flex-col items-center justify-center px-6 py-8 sm:px-10 sm:py-12 bg-black/80 rounded-3xl">
            <h2 className="relative z-10 text-2xl font-extrabold mb-2 text-saffron drop-shadow-lg">Book a Demo</h2>
            <p className="relative z-10 text-base text-white mb-6">Enter your email to schedule a personalized demo!</p>
            {submitted ? (
              <div className="relative z-10 text-green-400 text-center py-6 text-lg font-semibold">
                Thank you! Check your email for a Calendly link to book your demo.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative z-10 w-full space-y-4 flex flex-col items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full max-w-xs p-3 rounded-full border-2 border-saffron focus:border-saffron outline-none text-center text-base bg-white/10 text-white placeholder:text-gray-300"
                  placeholder="you@email.com"
                />
                {error && <div className="text-red-400 text-sm text-center w-full">{error}</div>}
                <div className="flex gap-2 pt-2 w-full">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1 rounded-full border-white text-white bg-transparent hover:bg-white/10">Cancel</Button>
                  <Button type="submit" className="flex-1 rounded-full bg-saffron text-primary hover:bg-saffron/90 text-base font-semibold shadow-lg" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Link'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 