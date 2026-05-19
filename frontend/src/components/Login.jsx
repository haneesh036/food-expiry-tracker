import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Leaf } from 'lucide-react';
import { API_URL } from '../config';

const Login = () => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-neutral)] p-4 md:p-8">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Info Side */}
        <div className="flex flex-col justify-center space-y-6 text-slate-700 mb-8 md:mb-0">
          <div className="bg-[var(--color-primary-light)]/20 p-4 rounded-2xl w-fit">
            <Leaf className="w-10 h-10 text-[var(--color-primary-dark)]" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">How EcoTrack Works</h2>
          
          <div className="space-y-6 mt-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary-light)]/30 text-[var(--color-primary-dark)] flex items-center justify-center font-bold text-lg">1</div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Scan & Track</h3>
                <p className="text-slate-600 mt-1">Use your device camera to easily scan product barcodes and upload labels to extract expiry dates using smart OCR.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary-light)]/30 text-[var(--color-primary-dark)] flex items-center justify-center font-bold text-lg">2</div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Smart Organization</h3>
                <p className="text-slate-600 mt-1">Keep track of your pantry, refrigerator, and freezer items in one centralized inventory dashboard.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary-light)]/30 text-[var(--color-primary-dark)] flex items-center justify-center font-bold text-lg">3</div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Reduce Waste</h3>
                <p className="text-slate-600 mt-1">View personal waste analytics and get insights on your food consumption to minimize your environmental footprint.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="card w-full max-w-md mx-auto md:mx-0 md:ml-auto shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[var(--color-primary-light)]/20 p-3 rounded-full mb-3 md:hidden">
              <Leaf className="w-8 h-8 text-[var(--color-primary-dark)]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Log in to your Smart Food Expiry Tracker</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2">Login</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account? <Link to="/register" className="text-[var(--color-primary)] font-medium hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
