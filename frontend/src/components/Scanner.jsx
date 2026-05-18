import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { Camera, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Scanner = () => {
  const [activeTab, setActiveTab] = useState('barcode'); // 'barcode' or 'ocr' or 'manual'
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '', brand: '', category: '', barcode: '', expiry_date: '', storage_location: 'Refrigerator', quantity: 1
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setScanning(true);
    try {
      if (videoRef.current) {
        // Fetch devices manually
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) throw new Error('No camera devices found');
        
        // Try to find a back/environment camera
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment') || 
          d.label.toLowerCase().includes('rear')
        );
        
        // Use back camera if found, else first available
        const selectedDeviceId = backCamera ? backCamera.deviceId : devices[0].deviceId;
        
        codeReader.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
          if (result) {
            handleBarcodeScanned(result.getText());
            stopScanning();
          }
        });
      }
    } catch (err) {
      console.error(err);
      alert('Camera access denied or no camera found.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    codeReader.current.reset();
    setScanning(false);
  };

  const handleBarcodeScanned = async (barcode) => {
    setFormData(prev => ({ ...prev, barcode }));
    try {
      const res = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (res.data.status === 1) {
        const product = res.data.product;
        setFormData(prev => ({
          ...prev,
          product_name: product.product_name || '',
          brand: product.brands || '',
          category: product.categories?.split(',')[0] || ''
        }));
        setActiveTab('ocr'); // Move to next step
      } else {
        alert('Product not found in database. Please enter details manually.');
        setActiveTab('manual');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      // More forgiving regex for dates (DD/MM/YYYY, MM/YY, YYYY-MM-DD, MMM YYYY)
      const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}([\/\-\.]\d{2,4})?|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|[A-Za-z]{3}\s\d{2,4})\b/g;
      const dates = text.match(dateRegex);
      
      if (dates && dates.length > 0) {
        let bestDateStr = dates[0];
        // Clean up basic string for parser
        let parsed = new Date(bestDateStr.replace(/[\/\.]/g, '-'));
        
        // Handle MM/YY edge cases simply
        if (bestDateStr.match(/^\d{1,2}[\/\-]\d{2}$/)) {
          const parts = bestDateStr.split(/[\/\-]/);
          parsed = new Date(`20${parts[1]}-${parts[0]}-01`);
        }

        if (!isNaN(parsed) && parsed.getFullYear() > 2000) {
          setFormData(prev => ({ ...prev, expiry_date: parsed.toISOString().split('T')[0] }));
          alert(`Detected date: ${bestDateStr}`);
        } else {
          alert(`Found "${bestDateStr}" but could not parse. Please verify manually.`);
        }
      } else {
        alert('No date detected clearly. Please enter manually.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process image');
    } finally {
      setOcrLoading(false);
      setActiveTab('manual');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${API_URL}/api/items`, {
        ...formData,
        user_id: user.id
      });
      navigate('/inventory');
    } catch (err) {
      console.error(err);
      alert('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Add New Item</h1>
        <p className="text-sm text-slate-500">Scan barcode, extract expiry, and save.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'barcode' ? 'border-[var(--color-primary)] text-[var(--color-primary-dark)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('barcode')}
        >
          1. Barcode
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ocr' ? 'border-[var(--color-primary)] text-[var(--color-primary-dark)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('ocr')}
        >
          2. Expiry Date (OCR)
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'manual' ? 'border-[var(--color-primary)] text-[var(--color-primary-dark)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('manual')}
        >
          3. Confirm Details
        </button>
      </div>

      <div className="card">
        {activeTab === 'barcode' && (
          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            {!scanning ? (
              <button onClick={startScanning} className="btn btn-primary flex flex-col items-center justify-center h-48 w-48 rounded-3xl gap-4">
                <Camera className="w-12 h-12" />
                <span className="text-lg">Start Scanner</span>
              </button>
            ) : (
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black shadow-lg">
                <video ref={videoRef} className="w-full h-auto"></video>
                <button onClick={stopScanning} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute inset-0 border-2 border-[var(--color-primary)] opacity-50 m-12 rounded-xl pointer-events-none"></div>
                <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-md">Center barcode in view</p>
              </div>
            )}
            <div className="text-center w-full max-w-sm">
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <input 
                type="text" 
                placeholder="Enter Barcode Manually" 
                className="input-field text-center" 
                value={formData.barcode}
                onChange={e => setFormData({...formData, barcode: e.target.value})}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleBarcodeScanned(formData.barcode);
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'ocr' && (
          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            <div className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:text-[var(--color-primary)] transition-colors" />
              <h3 className="text-lg font-medium text-slate-800">Upload Expiry Label</h3>
              <p className="text-sm text-slate-500 mt-2">Drag & drop or click to select image</p>
            </div>
            
            {ocrLoading && (
              <div className="flex items-center justify-center gap-3 text-[var(--color-primary)]">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                <span className="font-medium">Extracting text...</span>
              </div>
            )}

            <button onClick={() => setActiveTab('manual')} className="text-sm font-medium text-slate-500 hover:text-slate-800 underline">
              Skip to manual entry
            </button>
          </div>
        )}

        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input type="text" className="input-field" value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                <input type="text" className="input-field" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input type="text" className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
                <input type="text" className="input-field" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date *</label>
                <input type="date" className="input-field" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input type="number" min="1" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Storage Location</label>
                <select className="input-field py-2" value={formData.storage_location} onChange={e => setFormData({...formData, storage_location: e.target.value})}>
                  <option>Refrigerator</option>
                  <option>Freezer</option>
                  <option>Pantry</option>
                  <option>Kitchen Shelf</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={saving} className="btn btn-primary px-8">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Scanner;
