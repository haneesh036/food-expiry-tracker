import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Leaf, Clock, ChefHat, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';

const Login = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-neutral)] p-4">
        <div className="card w-full max-w-md shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[var(--color-primary)] p-3 rounded-full mb-3 shadow-lg shadow-[var(--color-primary-light)]/50">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to FreshTrack</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center font-medium border border-red-100">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                className="input-field py-2.5" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input 
                type="password" 
                className="input-field py-2.5" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-full py-2.5 text-base font-semibold shadow-lg hover:shadow-xl transition-all">Sign In</button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account? <Link to="/register" className="text-[var(--color-primary)] font-semibold hover:underline">Get Started Free</Link>
            </p>
            <button onClick={() => setShowLogin(false)} className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              &larr; Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FFF9] font-sans selection:bg-[var(--color-primary-light)] selection:text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between sticky top-0 bg-[#F8FFF9]/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="bg-[var(--color-primary)] p-1.5 rounded-full shadow-md shadow-[var(--color-primary)]/30">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">FreshTrack</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-[var(--color-primary)] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[var(--color-primary)] transition-colors">How it works</a>
          <a href="#reviews" className="hover:text-[var(--color-primary)] transition-colors">Reviews</a>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setShowLogin(true)} className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">Sign In</button>
          <Link to="/register" className="bg-[var(--color-primary)] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-xl hover:bg-[var(--color-primary-dark)] transition-all transform hover:-translate-y-0.5">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--color-primary-light)] bg-white/50 backdrop-blur-sm text-[var(--color-primary-dark)] text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
          <span className="text-[var(--color-primary)]">✨</span> SMART KITCHEN MANAGEMENT &middot; AI-POWERED
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
          Eat Fresh.<br />
          <span className="text-[var(--color-primary)]">Waste Nothing.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mb-10 font-light">
          FreshTrack is your AI-powered kitchen companion that tracks expiry dates, suggests smart recipes, and helps you save money while reducing food waste.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <Link to="/register" className="bg-[var(--color-primary)] text-white text-lg font-semibold px-8 py-4 rounded-full shadow-xl shadow-[var(--color-primary)]/30 hover:shadow-2xl hover:bg-[var(--color-primary-dark)] transition-all transform hover:-translate-y-1 flex items-center gap-2 group">
            Start Tracking Free 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
            No credit card &middot; Free forever plan
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-[var(--color-primary)] text-xs font-bold tracking-widest uppercase mb-3">EVERYTHING YOU NEED</h3>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Packed with powerful features</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-light">Every tool you need to run a smarter, waste-free kitchen &mdash; all in one place.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#F9FAFB] p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#FF7E4B] flex items-center justify-center mb-6 shadow-lg shadow-[#FF7E4B]/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Expiry Alerts</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Smart notifications days before anything goes bad. Never throw away forgotten produce again.</p>
            </div>
            
            <div className="bg-[#F9FAFB] p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center mb-6 shadow-lg shadow-[var(--color-primary)]/30">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Recipe Engine</h3>
              <p className="text-slate-500 leading-relaxed text-sm">FreshTrack reads your fridge and generates tailored recipes from whatever is about to expire.</p>
            </div>
            
            <div className="bg-[#F9FAFB] p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#5C85FF] flex items-center justify-center mb-6 shadow-lg shadow-[#5C85FF]/30">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Waste Analytics</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Weekly and monthly stats showing exactly how much food and money you are saving.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-[var(--color-primary)] text-xs font-bold tracking-widest uppercase mb-3">SIMPLE AS 1-2-3-4</h3>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">How FreshTrack works</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-[var(--color-primary-light)]/50 z-0"></div>
            
            {[
              { num: '01', title: 'Add your groceries', text: 'Log items as you shop or when you return home. Takes under a minute.' },
              { num: '02', title: 'Track expiry dates', text: 'FreshTrack colour-codes every item — green, amber, red — so status is instant.' },
              { num: '03', title: 'Get smart recipes', text: 'Our AI combines your expiring items into delicious, practical meal suggestions.' },
              { num: '04', title: 'Save money & the planet', text: 'Watch your food waste and spending drop week over week with live analytics.' },
            ].map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative z-10 text-center hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center mb-6 shadow-lg shadow-[var(--color-primary)]/30 text-lg">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[var(--color-primary)] p-1.5 rounded-full">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">FreshTrack</span>
          </div>
          <p className="text-slate-400 text-sm">
            &copy; 2026 FreshTrack. Designed to reduce food waste.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
