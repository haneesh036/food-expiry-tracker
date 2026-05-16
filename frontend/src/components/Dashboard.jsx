import React, { useState, useEffect } from 'react';
import { Package, Clock, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { API_URL } from '../config';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="card flex items-center p-6 gap-4">
    <div className={`p-4 rounded-2xl ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    expiringSoon: 0,
    expiredItems: 0,
    wastedItems: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await axios.get(`${API_URL}/api/stats?user_id=${user.id}`);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
          <p className="text-slate-500 text-sm">Here's your food inventory overview.</p>
        </div>
        <Link to="/scanner" className="btn btn-primary flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span className="hidden sm:inline">Add Item</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={stats.totalItems} icon={Package} colorClass="bg-blue-50 text-blue-500" />
        <StatCard title="Expiring Soon" value={stats.expiringSoon} icon={Clock} colorClass="bg-amber-50 text-amber-500" />
        <StatCard title="Expired" value={stats.expiredItems} icon={AlertTriangle} colorClass="bg-red-50 text-red-500" />
        <StatCard title="Wasted This Month" value={stats.wastedItems} icon={Trash2} colorClass="bg-slate-100 text-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
            <Link to="/inventory" className="text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="card p-0 overflow-hidden">
            {stats.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent activity</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentActivity.map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                        {item.category === 'Fruits' ? '🍎' : item.category === 'Dairy' ? '🥛' : '📦'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.product_name}</p>
                        <p className="text-xs text-slate-500">Added {moment(item.created_at).fromNow()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{moment(item.expiry_date).format('MMM Do, YYYY')}</p>
                      <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
          <div className="card">
            {stats.expiringSoon > 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Expiring Soon</h4>
                  <p className="text-xs text-amber-600 mt-1">You have {stats.expiringSoon} items expiring in the next 3 days. Use them soon!</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No new notifications</p>
            )}
            
            {stats.expiredItems > 0 && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex gap-3 items-start mt-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-800">Expired Items</h4>
                  <p className="text-xs text-red-600 mt-1">You have {stats.expiredItems} expired items. Please discard or mark them as wasted.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
