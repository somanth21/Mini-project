import { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Info, Package, Sparkles, RefreshCw, ThumbsUp, QrCode, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import ImpactDashboard from '../components/ImpactDashboard';

const HotelDashboard = () => {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const [uploadedFile, setUploadedFile] = useState(null);
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [estimatedServings, setEstimatedServings] = useState(0);
  const [servingConfidence, setServingConfidence] = useState(0.85);
  const [recommendedNgos, setRecommendedNgos] = useState([]);
  
  const [donationStatus, setDonationStatus] = useState('IDLE'); // IDLE, ANALYZED, SUBMITTED
  const [error, setError] = useState('');

  const [myDonations, setMyDonations] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrCode, setActiveQrCode] = useState('');
  const [activeQrToken, setActiveQrToken] = useState('');

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [correctedLabel, setCorrectedLabel] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!correctedLabel) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/ai/feedback', {
        originalPrediction: analysisResult?.foodType || foodType,
        correctLabel: correctedLabel,
        userRole: 'HOTEL'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackSubmitted(true);
      setFoodType(correctedLabel);
    } catch (err) {
      console.error('Failed to submit correction feedback:', err);
    }
  };

  const fetchMyDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:8080/api/donations/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyDonations(response.data);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    }
  };

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setAnalyzing(true);
    setError('');
    setRecommendedNgos([]);
    setEstimatedServings(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8080/api/ai/analyze-food', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const result = response.data;
      setAnalysisResult(result);
      setFoodType(result.foodType);
      
      const defaultQty = `10 portions`;
      setQuantity(defaultQty);
      setDonationStatus('ANALYZED');
      
      await runAiEstimation(file, defaultQty, result.foodType);
    } catch (err) {
      console.error('AI food analysis failed:', err);
      setError('AI Food recognition failed. Please upload a clear food photo.');
    } finally {
      setAnalyzing(false);
    }
  };

  const runAiEstimation = async (file, currentQty, currentFoodType) => {
    if (!file) return;
    setEstimating(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quantity', currentQty);
    formData.append('foodType', currentFoodType);

    try {
      const servingsRes = await axios.post('http://localhost:8080/api/ai/estimate-servings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const servingsData = servingsRes.data;
      setEstimatedServings(servingsData.estimatedServings);
      setServingConfidence(servingsData.confidence);
      
      const recommendRes = await axios.post('http://localhost:8080/api/ai/recommend-ngos', {
        latitude: user?.latitude || 17.4483,
        longitude: user?.longitude || 78.3741,
        foodType: currentFoodType,
        estimatedServings: servingsData.estimatedServings
      });
      
      setRecommendedNgos(recommendRes.data.recommendedNgos || []);
    } catch (err) {
      console.error('Serving estimation or recommendation failed:', err);
      setError('Serving estimation failed. Using raw numeric fallback.');
      const numMatch = currentQty.match(/\d+/);
      const val = numMatch ? parseInt(numMatch[0]) : 10;
      setEstimatedServings(val);
    } finally {
      setEstimating(false);
    }
  };

  const handleRecalculate = async (e) => {
    e.preventDefault();
    if (!uploadedFile || !analysisResult) return;
    await runAiEstimation(uploadedFile, quantity, foodType);
  };

  const submitDonation = async () => {
    setDonationStatus('SUBMITTING');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/donations', {
        foodType: foodType,
        category: analysisResult.category,
        quantity: estimatedServings || 10,
        description: `Quality freshness score: ${analysisResult.freshnessScore}%. ${analysisResult.recommendation}. Estimated servings: ${estimatedServings}.`,
        freshnessScore: analysisResult.freshnessScore,
        AIRecommendation: analysisResult.recommendation,
        latitude: user?.latitude || 17.4483,
        longitude: user?.longitude || 78.3741,
        pickupAddress: user?.address || 'Hotel and Hostal Pickup Address'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonationStatus('SUBMITTED');
      fetchMyDonations();
    } catch (err) {
      console.error('Failed to submit donation:', err);
      setError('Failed to submit donation to the server.');
      setDonationStatus('ANALYZED');
    }
  };

  const handleShowQr = async (donationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:8080/api/donations/${donationId}/generate-qr`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveQrCode(response.data.qrCodeImage);
      setActiveQrToken(response.data.token);
      setShowQrModal(true);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hotel and Hostals Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name || 'Partner'}. Rescuing food waste using AI.</p>
        </div>
      </header>

      {/* Real Impact Section */}
      <ImpactDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & History */}
        <div className="lg:col-span-2 space-y-8">
          {/* New Donation Form */}
          <div className="card p-8 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Package size={20} className="text-brand-primary" />
              New Food Donation
            </h2>

            {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-semibold border border-rose-100 mb-4">{error}</div>}

            {donationStatus === 'SUBMITTED' ? (
              <div className="py-12 text-center space-y-4 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Donation Registered!</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-xs">
                  Your surplus food has been registered. NGOs have been notified and recommendation scores compiled.
                </p>
                <button 
                  onClick={() => {setDonationStatus('IDLE'); setAnalysisResult(null); setUploadedFile(null); setRecommendedNgos([]); setError(''); setFeedbackSubmitted(false); setCorrectedLabel(''); setShowFeedbackForm(false);}} 
                  className="bg-brand-primary hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all cursor-pointer text-xs shadow-md"
                >
                  Make Another Donation
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Image Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                    analyzing 
                    ? 'border-brand-primary bg-emerald-50/10' 
                    : analysisResult 
                    ? 'border-emerald-200 bg-emerald-50/5' 
                    : 'border-slate-300 hover:border-brand-primary'
                  }`}
                >
                  {!analysisResult ? (
                    <div className="space-y-4">
                      {analyzing ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-brand-primary rounded-full animate-spin" />
                          <p className="text-brand-primary font-medium animate-pulse text-sm">AI Food Recognition processing...</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Camera size={32} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-slate-900">Upload surplus food photo</p>
                            <p className="text-slate-500 text-sm">AI recognizes food types and scores freshness instantly</p>
                          </div>
                          <input 
                            type="file" 
                            id="food-upload" 
                            className="hidden" 
                            onChange={handleFileUpload} 
                            accept="image/*"
                          />
                          <label htmlFor="food-upload" className="bg-brand-primary hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-2 transition-all shadow-md">
                            <Upload size={18} />
                            <span>Browse Photo</span>
                          </label>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left animate-in fade-in duration-300">
                      <div className="space-y-4">
                        <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 italic overflow-hidden relative border border-slate-200">
                           {uploadedFile ? (
                             <img src={URL.createObjectURL(uploadedFile)} className="absolute inset-0 w-full h-full object-cover" alt="Food Surplus" />
                           ) : (
                             <span className="text-xs">No image preview</span>
                           )}
                        </div>
                        <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex gap-2.5">
                           <Info size={16} className="text-brand-primary shrink-0 mt-0.5" />
                           <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">AI analysis is automated. Correct the values below if needed before submitting.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI Classification</label>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-2xl font-extrabold text-slate-900">{foodType}</p>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <Sparkles size={12} /> {Math.round(analysisResult.confidence * 100)}% Match
                            </span>
                            {(() => {
                              const pct = Math.round(analysisResult.confidence * 100);
                              let tier = "Low";
                              let color = "bg-rose-50 border-rose-200 text-rose-700";
                              if (pct >= 95) {
                                tier = "High";
                                color = "bg-emerald-50 border-emerald-200 text-emerald-700";
                              } else if (pct >= 80) {
                                tier = "Good";
                                color = "bg-blue-50 border-blue-200 text-blue-700";
                              } else if (pct >= 60) {
                                tier = "Moderate";
                                color = "bg-amber-50 border-amber-200 text-amber-700";
                              }
                              return (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
                                  {tier}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-brand-primary text-sm font-semibold">{analysisResult.category}</p>
                          {analysisResult.confidence < 0.6 && (
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-[11px] font-medium leading-relaxed mt-2">
                              ⚠️ Low-confidence prediction. Manual verification recommended.
                            </div>
                          )}
                        </div>

                        {analysisResult.explanation && (
                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Reasoning (Explainability)</p>
                            <p className="text-xs text-slate-600 leading-relaxed italic">"{analysisResult.explanation}"</p>
                          </div>
                        )}

                        {analysisResult.top3Predictions && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alternative Predictions</p>
                            <div className="grid grid-cols-3 gap-2">
                              {analysisResult.top3Predictions.map((pred, i) => (
                                <div key={i} className="p-2 bg-white border border-slate-150 rounded-lg text-center shadow-sm">
                                  <p className="text-xs font-bold text-slate-700">{pred.label || pred.foodType}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{Math.round(pred.confidence * 100)}% Match</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-3.5 border border-slate-150 rounded-xl bg-slate-50/20 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prediction Quality Feedback</span>
                            {!feedbackSubmitted && (
                              <button 
                                type="button"
                                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold underline cursor-pointer"
                              >
                                {showFeedbackForm ? "Cancel" : "Incorrect prediction?"}
                              </button>
                            )}
                          </div>
                          {feedbackSubmitted ? (
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">✓ Thank you! Correction recorded to retrain the AI.</p>
                          ) : (
                            showFeedbackForm && (
                              <form onSubmit={handleFeedbackSubmit} className="flex gap-2 items-center mt-1 animate-in slide-in-from-top-2">
                                <select 
                                  value={correctedLabel}
                                  onChange={(e) => setCorrectedLabel(e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none flex-grow"
                                >
                                  <option value="">-- Select Correct Food Type --</option>
                                  {["Biryani", "Rice", "Bread", "Curry", "Fruits", "Vegetables"].map(label => (
                                    <option key={label} value={label}>{label}</option>
                                  ))}
                                </select>
                                <button 
                                  type="submit" 
                                  disabled={!correctedLabel}
                                  className="btn bg-indigo-600 hover:bg-indigo-700 border-none text-white text-xs font-bold py-2 px-3 rounded-lg cursor-pointer"
                                >
                                  Submit
                                </button>
                              </form>
                            )
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <p className="text-xs text-slate-500 font-medium">Freshness Score</p>
                            <p className="text-xl font-bold text-emerald-600">{analysisResult.freshnessScore}%</p>
                          </div>
                          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm relative">
                            <p className="text-xs text-slate-500 font-medium">Est. Servings</p>
                            {estimating ? (
                              <RefreshCw size={14} className="animate-spin text-slate-400 absolute right-3 top-3" />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 absolute right-3 top-3">
                                {Math.round(servingConfidence * 100)}% Conf.
                              </span>
                            )}
                            <p className="text-xl font-bold text-slate-900">{estimatedServings}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">AI Safety Recommendation</p>
                          <p className="text-xs text-emerald-700 leading-relaxed font-medium">{analysisResult.recommendation}</p>
                        </div>

                        <form onSubmit={handleRecalculate} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">Modify Food Type & Quantity</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <input 
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
                                value={foodType}
                                onChange={(e) => setFoodType(e.target.value)}
                                placeholder="Food type"
                              />
                              <input 
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="e.g. 10 kg, 20 portions"
                              />
                            </div>
                          </div>
                          <button 
                            type="submit" 
                            disabled={estimating} 
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {estimating ? <RefreshCw className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                            <span>Recalculate AI Servings & Match NGOs</span>
                          </button>
                        </form>

                        {recommendedNgos.length > 0 && (
                          <div className="space-y-2 animate-in fade-in duration-300">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <ThumbsUp size={12} className="text-brand-primary" /> Top AI NGO Recommendations
                            </label>
                            <div className="space-y-2">
                              {recommendedNgos.map((ngo, idx) => (
                                <div key={ngo.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-emerald-600/30 transition-all shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-brand-primary flex items-center justify-center text-xs font-extrabold">{idx + 1}</div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800">{ngo.name}</p>
                                      <p className="text-[10px] text-slate-400">{ngo.distanceKm} km away • {ngo.capacity.toLowerCase()} capacity</p>
                                    </div>
                                  </div>
                                  <span className="bg-emerald-50 text-brand-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">
                                    {Math.round(ngo.score * 100)}% match
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <button 
                            onClick={submitDonation} 
                            disabled={donationStatus === 'SUBMITTING' || estimating}
                            className="bg-brand-primary hover:bg-emerald-600 text-white font-bold w-full py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer text-sm"
                          >
                            {donationStatus === 'SUBMITTING' ? 'Registering surplus...' : 'Confirm Surplus Donation'}
                          </button>
                          <button 
                            onClick={() => { setAnalysisResult(null); setUploadedFile(null); setRecommendedNgos([]); setError(''); setFeedbackSubmitted(false); setCorrectedLabel(''); setShowFeedbackForm(false); }} 
                            className="text-slate-400 text-xs font-semibold w-full text-center mt-3 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            Cancel / Re-upload
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* My Donations List Section */}
          <div className="card p-8 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <QrCode size={20} className="text-brand-primary" />
              My Donations & Handover Verifications
            </h2>

            <div className="space-y-4">
              {myDonations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No donations created yet.</p>
              ) : (
                myDonations.map((d) => (
                  <div key={d.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{d.foodType}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          d.status === 'DELIVERED' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                            : d.status === 'ACCEPTED'
                            ? 'bg-blue-50 border-blue-100 text-blue-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {d.quantity} servings • {d.pickupAddress}
                      </p>
                      {d.ngo && (
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Matched Partner: {d.ngo.name}
                        </p>
                      )}
                    </div>

                    {d.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleShowQr(d.id)}
                        className="btn btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                      >
                        <QrCode size={14} />
                        Get Handover QR
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          <div className="card p-6 bg-slate-900 text-white rounded-3xl">
             <h3 className="text-lg font-bold mb-4">Safety & Guidelines</h3>
             <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
               <p><strong>1. Temperature Checks:</strong> Keep prepared meals below 4°C or above 60°C until pickup.</p>
               <p><strong>2. Proper Packaging:</strong> Seal food in single-use food-grade containers.</p>
               <p><strong>3. AI Verification:</strong> Take clear, well-lit photos of the food for accurate freshness scoring.</p>
             </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative text-center space-y-4 animate-in zoom-in duration-300">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-800">Verification Handover QR</h3>
            <p className="text-xs text-slate-500">Show this QR code to the volunteer when they pick up the food packages.</p>
            
            <div className="w-48 h-48 bg-slate-100 mx-auto rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden">
              {activeQrCode ? (
                <img src={activeQrCode} alt="Handover QR" className="w-full h-full" />
              ) : (
                <span className="text-xs text-slate-400 animate-pulse">Generating...</span>
              )}
            </div>
            
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Verification Token</span>
              <code className="text-xs text-brand-primary font-bold block mt-1 select-all">{activeQrToken}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelDashboard;
