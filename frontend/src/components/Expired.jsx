import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { API_URL } from '../config';

const Expired = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiredItems();
  }, []);

  const fetchExpiredItems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`${API_URL}/api/items?user_id=${user.id}`);
      
      const allItems = res.data;
      const today = moment().startOf('day');
      
      const expiredOrWasted = allItems.filter(item => {
        if (item.status === 'wasted') return true;
        if (item.status === 'active' && item.expiry_date) {
          const expiry = moment(item.expiry_date);
          return expiry.diff(today, 'days') < 0;
        }
        return false;
      });

      setItems(expiredOrWasted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/items/${id}/status`, { status });
      fetchExpiredItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/api/items/${id}`);
      fetchExpiredItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expired Items</h1>
          <p className="text-sm text-slate-500">Track and manage food waste</p>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-600">
              <th className="p-4 rounded-tl-xl">Product</th>
              <th className="p-4">Location</th>
              <th className="p-4">Expired On</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-green-50 p-4 rounded-full mb-4">
                      <AlertTriangle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">No Expired Items!</h3>
                    <p className="text-sm text-slate-500 mt-1">Great job keeping track of your food.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{item.product_name}</div>
                    {item.category && <div className="text-xs text-slate-500">{item.category}</div>}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{item.storage_location || '-'}</td>
                  <td className="p-4 text-sm font-medium text-red-600">
                    {item.expiry_date ? moment(item.expiry_date).format('MMM DD, YYYY') : '-'}
                  </td>
                  <td className="p-4">
                    {item.status === 'wasted' ? (
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">Wasted</span>
                    ) : (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" /> Needs Attention
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {item.status === 'active' ? (
                      <button 
                        onClick={() => updateStatus(item.id, 'wasted')}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                      >
                        Mark as Wasted
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expired;
