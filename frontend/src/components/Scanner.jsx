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
  const [cameraError, setCameraError] = useState(false);
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
    setCameraError(false);
    try {
      if (videoRef.current) {
        // 1. Explicitly request camera permissions (triggers browser popup)
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch (e) {
          // Fallback to front camera if environment fails
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        // 2. Attach stream to video element
        videoRef.current.srcObject = stream;
        
        // Wait for video to start playing
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve);
          };
        });

        // 3. Decode from the playing video element
        codeReader.current.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (result) {
            handleBarcodeScanned(result.getText());
            stopScanning();
          }
        });
      }
    } catch (err) {
      console.error("Camera access failed entirely:", err);
      setCameraError(true);
      setScanning(false);
    }
  };

  const handleBarcodeImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const result = await codeReader.current.decodeFromImageUrl(url);
      if (result) {
        handleBarcodeScanned(result.getText());
      }
    } catch (err) {
      console.error(err);
      alert('Could not detect barcode from image. Please try again or enter manually.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
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
      const text = result.data.text.toLowerCase();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      let bestDateStr = null;
      const keywords = ['use by', 'bb', 'best before', 'exp', 'expiry'];
      const dateRegex = /\b(\d{1,2}[\/\-\.][a-z]{3}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{1,2}([\/\-\.]\d{2,4})?|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|[a-z]{3}\s\d{2,4})\b/i;

      // 1. Try to find a line with a keyword AND a date
      for (const line of lines) {
        if (keywords.some(kw => line.includes(kw))) {
          const match = line.match(dateRegex);
          if (match) {
            bestDateStr = match[0];
            break;
          }
        }
      }

      // 2. If not found, look for keyword, then check next line for date
      if (!bestDateStr) {
        for (let i = 0; i < lines.length; i++) {
          if (keywords.some(kw => lines[i].includes(kw))) {
            const match = lines[i+1]?.match(dateRegex);
            if (match) {
              bestDateStr = match[0];
              break;
            }
          }
        }
      }

      // 3. Fallback: just find any date in the whole text
      if (!bestDateStr) {
        const match = text.match(dateRegex);
        if (match) bestDateStr = match[0];
      }
      
      if (bestDateStr) {
        let parsed = new Date();
        const cleanStr = bestDateStr.replace(/[\/\.]/g, '-');
        const parts = cleanStr.split('-');
        const monthMap = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };

        if (parts.length === 3) {
          let d = parts[0];
          let m = parts[1].toLowerCase();
          let y = parts[2];
          
          if (monthMap[m]) m = monthMap[m];
          
          if (d.length === 4) {
            // YYYY-MM-DD
            parsed = new Date(`${d}-${m}-${y}`);
          } else {
            // DD-MM-YY or DD-MM-YYYY
            if (y.length === 2) y = `20${y}`;
            parsed = new Date(`${y}-${m}-${d}`);
          }
        } else if (parts.length === 2) {
          // MM-YY or MM-YYYY
          let m = parts[0].toLowerCase();
          let y = parts[1];
          if (monthMap[m]) m = monthMap[m];
          if (y.length === 2) y = `20${y}`;
          parsed = new Date(`${y}-${m}-01`);
        } else {
           parsed = new Date(cleanStr);
        }

        if (!isNaN(parsed) && parsed.getFullYear() > 2000) {
          const isoDate = parsed.toISOString().split('T')[0];
          setFormData(prev => ({ ...prev, expiry_date: isoDate }));
          alert(`Detected date: ${isoDate} (from "${bestDateStr}")`);
        } else {
          alert(`Found "${bestDateStr}" but could not parse it as a valid date. Please verify manually.`);
        }
      } else {
        alert('No expiry date detected clearly. Please enter manually.');
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
              <div className="flex flex-col items-center gap-4">
                <button onClick={startScanning} className="btn btn-primary flex flex-col items-center justify-center h-48 w-48 rounded-3xl gap-4">
                  <Camera className="w-12 h-12" />
                  <span className="text-lg">Start Scanner</span>
                </button>
                {cameraError && (
                  <div className="text-center mt-2">
                    <p className="text-red-500 text-sm mb-3">Camera not available or blocked.</p>
                    <label className="btn btn-outline cursor-pointer px-6">
                      <ImageIcon className="w-4 h-4" />
                      Take Photo / Upload Barcode
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBarcodeImage} />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black shadow-lg">
                <video ref={videoRef} className="w-full h-auto" autoPlay playsInline muted></video>
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
