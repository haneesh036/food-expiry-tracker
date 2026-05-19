import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { Camera, Image as ImageIcon, Upload, X, FlipHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Scanner = () => {
  const [activeTab, setActiveTab] = useState('barcode');
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '', brand: '', category: '', barcode: '', expiry_date: '', storage_location: 'Refrigerator', quantity: 1
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const scanningRef = useRef(false);
  const navigate = useNavigate();

  const stopScanning = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    readerRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const startReader = useCallback(async (stream) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.muted = true;

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onerror = reject;
      setTimeout(resolve, 2000);
    });

    if (!scanningRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    try {
      await reader.decodeFromVideoElement(video, (result, error, controls) => {
        if (!scanningRef.current) {
          if (controls) controls.stop();
          return;
        }

        if (result) {
          if (controls) controls.stop();
          stopScanning();
          handleBarcodeScanned(result.getText());
        }
      });
    } catch (err) {
      console.error('[Scanner] decodeFromVideoElement error:', err);
    }
  }, [stopScanning]);

  const startScanning = async () => {
    setCameraError('');
    setScanning(true);
    scanningRef.current = true;

    await new Promise(r => setTimeout(r, 150));

    if (!videoRef.current) {
      setScanning(false);
      scanningRef.current = false;
      setCameraError('Video element not found. Please try again.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (!scanningRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      await startReader(stream);
    } catch (err) {
      scanningRef.current = false;
      setScanning(false);
      const msg = String(err?.message || err?.name || err || '').toLowerCase();

      if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        setCameraError('Camera permission denied. Please allow camera access in settings.');
      } else if (msg.includes('notfound') || msg.includes('nodevice')) {
        setCameraError('No camera found on this device.');
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          scanningRef.current = true;
          setScanning(true);
          await startReader(stream);
        } catch {
          setCameraError('Camera failed to start. Enter details manually.');
          setScanning(false);
        }
      }
    }
  };

  const switchCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    stopScanning();
    await new Promise(r => setTimeout(r, 200));
    setScanning(true);
    scanningRef.current = true;
    await new Promise(r => setTimeout(r, 150));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: newFacing } },
        audio: false,
      });
      streamRef.current = stream;
      await startReader(stream);
    } catch (err) {
      console.error('[Scanner] switch camera error:', err);
      setScanning(false);
    }
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
      const rawText = result.data.text.toLowerCase();
      // Remove spaces for easier matching of dot-matrix printed dates
      const text = rawText.replace(/\s+/g, '');
      const lines = rawText.split('\n').map(l => l.replace(/\s+/g, '')).filter(l => l.length > 0);
      
      let bestDateStr = null;
      let bestDateObj = null;
      
      const keywords = ['useby', 'bb', 'bestbefore', 'exp', 'expiry', 'e'];
      const dateRegex = /(?:\D|^)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\/\-\.]?\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\-\.]?\d{2,4})(?:\D|$)/gi;

      const parseDateStr = (dateStr) => {
        const cleanStr = dateStr.toLowerCase().replace(/[\/\.]/g, '-');
        const partsMatch = cleanStr.match(/^(\d{1,2})-?(\d{1,2})-?(\d{2,4})$/) || 
                           cleanStr.match(/^(\d{1,2})-?([a-z]{3,})-?(\d{2,4})$/) ||
                           cleanStr.match(/^(\d{1,2})-?(\d{2,4})$/) ||
                           cleanStr.match(/^([a-z]{3,})-?(\d{2,4})$/);
                           
        if (!partsMatch) return null;
        
        const monthMap = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
        let d = '1', m, y;
        
        if (partsMatch.length === 4) {
           d = partsMatch[1];
           m = monthMap[partsMatch[2].substring(0,3)] || partsMatch[2];
           y = partsMatch[3];
        } else if (partsMatch.length === 3) {
           m = monthMap[partsMatch[1].substring(0,3)] || partsMatch[1];
           y = partsMatch[2];
        }
        
        y = parseInt(y, 10);
        if (y < 100) y += 2000;
        
        const parsed = new Date(y, parseInt(m, 10) - 1, parseInt(d, 10));
        return isNaN(parsed) ? null : parsed;
      };
      
      const allMatches = [...text.matchAll(dateRegex)].map(m => m[1]);
      const validDates = [];
      
      for (const match of allMatches) {
        const pDate = parseDateStr(match);
        if (pDate && pDate.getFullYear() >= 2020 && pDate.getFullYear() <= 2050) {
            validDates.push({ str: match, date: pDate });
        }
      }

      // 1. Try to find a date close to a keyword
      for (const line of lines) {
        if (keywords.some(kw => line.includes(kw))) {
            const matchesInLine = [...line.matchAll(dateRegex)].map(m => m[1]);
            for (const m of matchesInLine) {
                const pDate = parseDateStr(m);
                if (pDate && pDate.getFullYear() >= 2020 && pDate.getFullYear() <= 2050) {
                    bestDateStr = m;
                    bestDateObj = pDate;
                    break;
                }
            }
        }
        if (bestDateObj) break;
      }
      
      // 2. Try the next line if a keyword is found but no date
      if (!bestDateObj) {
        for (let i = 0; i < lines.length - 1; i++) {
           if (keywords.some(kw => lines[i].includes(kw))) {
               const matchesInNextLine = [...lines[i+1].matchAll(dateRegex)].map(m => m[1]);
               for (const m of matchesInNextLine) {
                  const pDate = parseDateStr(m);
                  if (pDate && pDate.getFullYear() >= 2020 && pDate.getFullYear() <= 2050) {
                      bestDateStr = m;
                      bestDateObj = pDate;
                      break;
                  }
               }
           }
           if (bestDateObj) break;
        }
      }

      // 3. Pick best valid date from all matches
      if (!bestDateObj && validDates.length > 0) {
         const futureDates = validDates.filter(d => d.date > new Date());
         if (futureDates.length > 0) {
            bestDateObj = futureDates[0].date;
            bestDateStr = futureDates[0].str;
         } else {
            bestDateObj = validDates[0].date;
            bestDateStr = validDates[0].str;
         }
      }

      if (bestDateObj) {
        const yyyy = bestDateObj.getFullYear();
        const mm = String(bestDateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(bestDateObj.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        setFormData(prev => ({ ...prev, expiry_date: isoDate }));
        alert(`Detected date: ${isoDate} (from "${bestDateStr}")`);
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
                <button onClick={startScanning} className="w-full flex flex-col items-center justify-center gap-4 p-10 rounded-2xl bg-[var(--color-primary-light)]/10 border-2 border-dashed border-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/20 transition-colors text-[var(--color-primary-dark)]">
                  <Camera className="w-12 h-12" />
                  <span className="font-bold text-sm">Open Camera to Scan Barcode</span>
                  <span className="text-xs font-medium">Uses device camera</span>
                </button>
                {cameraError && (
                  <div className="text-center mt-2 w-full">
                    <p className="text-red-500 text-sm mb-3 font-medium bg-red-50 p-3 rounded-xl border border-red-100">{cameraError}</p>
                    <label className="btn btn-outline cursor-pointer px-6 mt-2 inline-flex">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Take Photo / Upload Barcode
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBarcodeImage} />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black shadow-lg" style={{ aspectRatio: '16/9' }}>
                <style>{`
                  @keyframes scan-laser {
                    0%, 100% { top: 8%; }
                    50% { top: 92%; }
                  }
                `}</style>
                <video ref={videoRef} className="w-full h-full object-cover block" autoPlay playsInline muted></video>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[75%] h-[60%] max-w-[420px] max-h-[260px] border-2 border-[var(--color-primary)] rounded-2xl opacity-90 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[var(--color-primary)] rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[var(--color-primary)] rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[var(--color-primary)] rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[var(--color-primary)] rounded-br-lg" />
                    
                    <div 
                      className="absolute left-0 right-0 h-[2px] bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" 
                      style={{ animation: 'scan-laser 2.5s ease-in-out infinite', top: '8%' }} 
                    />
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={switchCamera} className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors" title="Switch camera">
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button onClick={stopScanning} className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="absolute bottom-4 left-0 right-0 text-center text-white text-xs font-medium drop-shadow-md tracking-wider uppercase">Center barcode in view</p>
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
