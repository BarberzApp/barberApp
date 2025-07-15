'use client'

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Car, Sparkles, CheckCircle, User } from 'lucide-react';

const deliverySteps = [
  {
    status: 'Searching for Stylist',
    time: 'Finding the perfect match...',
    icon: <User className="w-6 h-6" />,
    color: 'bg-saffron'
  },
  {
    status: 'Appointment confirmed',
    time: 'Preparing for your appointment',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    status: 'On the way',
    time: 'Arriving in 15-20 min',
    icon: <Car className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    status: 'Service in progress',
    time: 'Getting you fresh!',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'bg-purple-500'
  }
];

export default function ReachPage() {
  const [deliveryStep, setDeliveryStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setDeliveryStep((prev) => (prev + 1) % 4);
        setIsAnimating(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError('Failed to join waitlist. Please try again.');
      }
    } catch {
      setError('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background/80 shadow-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-saffron rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white font-bebas tracking-wide">BOCM Reach</span>
          </div>
          <div className="bg-saffron/10 text-saffron px-4 py-2 rounded-full text-sm font-medium">
            Coming August 2025
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-saffron/30 to-background">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-center font-bebas tracking-wide drop-shadow-lg">
          Style delivered to your door
        </h1>
        <p className="text-lg sm:text-xl text-saffron mb-8 text-center max-w-xl">
          Professional cosmetologists come to you. Book in seconds, get fresh in minutes.
        </p>
        {/* Animated Delivery Status */}
        <div className={`w-full max-w-md mx-auto bg-white/10 border border-white/10 rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-lg transition-all duration-300 ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-full ${deliverySteps[deliveryStep].color} flex items-center justify-center text-white`}>
              {deliverySteps[deliveryStep].icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white text-lg">{deliverySteps[deliveryStep].status}</div>
              <div className="text-sm text-white/70">{deliverySteps[deliveryStep].time}</div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-saffron h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((deliveryStep + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
        {/* Waitlist Input */}
        <div className="w-full max-w-md mx-auto flex flex-col sm:flex-row gap-3 mt-4">
          <form onSubmit={handleWaitlistSubmit} className="w-full flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email for early access"
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-saffron/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
            <button type="submit" className="bg-saffron text-primary px-6 py-3 rounded-lg font-semibold shadow hover:bg-saffron/90 transition-colors">
              Join Waitlist
            </button>
          </form>
        </div>
        {submitted && <div className="text-green-400 text-center mt-2">You've been added to the waitlist!</div>}
        {error && <div className="text-red-400 text-center mt-2">{error}</div>}
        <div className="text-white/60 text-sm mt-4 text-center">
          Early access • Be part of the development • No spam, ever
        </div>
      </div>
      {/* Coming Soon Message */}
      <div className="text-center text-saffron font-bold text-lg py-8">
        BOCM Reach is coming soon. Stay tuned!
      </div>
    </div>
  );
} 