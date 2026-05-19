import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Search, Filter, Trash2, Plus, Edit2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);

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

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/items/${editingItem.id}`, editingItem);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      alert('Failed to update item');
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
    if (item.status !== 'active') return false;
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
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {item.status === 'active' && (
                      <button 
                        onClick={() => setEditingItem({...item})}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors ml-2"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Edit Item</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input type="text" className="input-field py-2" value={editingItem.product_name || ''} onChange={e => setEditingItem({...editingItem, product_name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input type="text" className="input-field py-2" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input type="number" className="input-field py-2" min="1" value={editingItem.quantity || 1} onChange={e => setEditingItem({...editingItem, quantity: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input type="date" className="input-field py-2" value={editingItem.expiry_date ? editingItem.expiry_date.split('T')[0] : ''} onChange={e => setEditingItem({...editingItem, expiry_date: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <select className="input-field py-2" value={editingItem.storage_location || 'Refrigerator'} onChange={e => setEditingItem({...editingItem, storage_location: e.target.value})}>
                    <option>Refrigerator</option>
                    <option>Freezer</option>
                    <option>Pantry</option>
                    <option>Kitchen Shelf</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingItem(null)} className="btn btn-outline px-6">Cancel</button>
                <button type="submit" className="btn btn-primary px-6">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
