import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Search, Filter, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`${API_URL}/api/items?user_id=${user.id}`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/api/items/${id}`);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/items/${id}/status`, { status });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (item) => {
    if (item.status === 'wasted') return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">Wasted</span>;
    if (item.status === 'consumed') return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium">Consumed</span>;
    
    if (!item.expiry_date) return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">Unknown</span>;
    
    const today = moment().startOf('day');
    const expiry = moment(item.expiry_date);
    const daysDiff = expiry.diff(today, 'days');

    if (daysDiff < 0) return <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">Expired</span>;
    if (daysDiff <= 3) return <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded text-xs font-medium">Expiring Soon</span>;
    return <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium">Fresh</span>;
  };

  const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="text-sm text-slate-500">Manage your food items</p>
        </div>
        <Link to="/scanner" className="btn btn-primary flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Item
        </Link>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="input-field pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="input-field py-2"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-600">
              <th className="p-4 rounded-tl-xl">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Location</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">No items found.</td></tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{item.product_name}</div>
                    {item.brand && <div className="text-xs text-slate-500">{item.brand}</div>}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{item.category || '-'}</td>
                  <td className="p-4 text-sm text-slate-600">{item.storage_location || '-'}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {item.expiry_date ? moment(item.expiry_date).format('MMM DD, YYYY') : '-'}
                  </td>
                  <td className="p-4">{getStatusBadge(item)}</td>
                  <td className="p-4 text-right">
                    {item.status === 'active' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => updateStatus(item.id, 'consumed')}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                        >
                          Consume
                        </button>
                        <button 
                          onClick={() => updateStatus(item.id, 'wasted')}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                          Waste
                        </button>
                      </div>
                    )}
                    {item.status !== 'active' && (
                       <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

export default Inventory;
