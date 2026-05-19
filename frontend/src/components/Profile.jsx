import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Activity, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, consumed: 0, wasted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    if (userData) {
      fetchUserStats(userData.id);
    }
  }, []);

  const fetchUserStats = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/api/items?user_id=${userId}`);
      const items = res.data;
      
      const total = items.length;
      const consumed = items.filter(i => i.status === 'consumed').length;
      const wasted = items.filter(i => i.status === 'wasted').length;
      
      setStats({ total, consumed, wasted });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Your Profile</h1>
        <p className="text-sm text-slate-500">Manage your account and view your FreshTrack stats</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary-light)]/40 mb-4 text-white text-3xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
            <div className="mt-6 w-full pt-6 border-t border-slate-100 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Active Account
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--color-primary)]" />
              Your FreshTrack Impact
            </h3>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                  <div className="text-3xl font-black text-slate-700 mb-1">{stats.total}</div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Items</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                  <div className="text-3xl font-black text-blue-600 mb-1">{stats.consumed}</div>
                  <div className="text-xs font-medium text-blue-500 uppercase tracking-wider">Consumed</div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
                  <div className="text-3xl font-black text-orange-500 mb-1">{stats.wasted}</div>
                  <div className="text-xs font-medium text-orange-500 uppercase tracking-wider">Wasted</div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
              Account Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm font-medium text-slate-500">Name</span>
                <span className="text-sm font-semibold text-slate-800">{user.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm font-medium text-slate-500">Email</span>
                <span className="text-sm font-semibold text-slate-800">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm font-medium text-slate-500">Password</span>
                <span className="text-sm font-semibold text-slate-800">••••••••</span>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
               <button className="btn btn-outline text-sm py-2" onClick={() => alert('Editing profile is coming soon!')}>Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
