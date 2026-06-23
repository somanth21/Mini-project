import { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, PieChart, Info, Package, Sparkles, MapPin, Heart, ArrowRight, RefreshCw, ThumbsUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const HotelDashboard = () => {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Custom interactive inputs after upload
  const [uploadedFile, setUploadedFile] = useState(null);
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [estimatedServings, setEstimatedServings] = useState(0);
  const [servingConfidence, setServingConfidence] = useState(0.85);
  const [recommendedNgos, setRecommendedNgos] = useState([]);
  
  const [donationStatus, setDonationStatus] = useState('IDLE'); // IDLE, ANALYZED, SUBMITTED
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState({
    activeDonations: 0,
    mealsDonated: 0,
    successfulPickups: 0,
    ngosHelped: 0,
    carbonSaved: 0
  });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:8080/api/donations/hotel/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching hotel stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
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
      // Calls Spring Boot gateway endpoint
      const response = await axios.post('http://localhost:8080/api/ai/analyze-food', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const result = response.data;
      setAnalysisResult(result);
      setFoodType(result.foodType);
      
      // Default guess for quantity
      const defaultQty = `10 portions`;
      setQuantity(defaultQty);
      setDonationStatus('ANALYZED');
      
      // Run automatic servings and recommendation using default guess
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
      // 1. Serving Estimation
      const servingsRes = await axios.post('http://localhost:8080/api/ai/estimate-servings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const servingsData = servingsRes.data;
      setEstimatedServings(servingsData.estimatedServings);
      setServingConfidence(servingsData.confidence);
      
      // 2. Fetch NGO Recommendations
      const recommendRes = await axios.post('http://localhost:8080/api/ai/recommend-ngos', {
        latitude: user?.latitude || 12.9716,
        longitude: user?.longitude || 77.5946,
        foodType: currentFoodType,
        estimatedServings: servingsData.estimatedServings
      });
      
      setRecommendedNgos(recommendRes.data.recommendedNgos || []);
    } catch (err) {
      console.error('Serving estimation or recommendation failed:', err);
      setError('Serving estimation failed. Using raw numeric fallback.');
      
      // Simple fallback calculation
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
        latitude: user?.latitude || 12.9716,
        longitude: user?.longitude || 77.5946,
        pickupAddress: user?.address || 'Hotel Pickup Address'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonationStatus('SUBMITTED');
      fetchStats();
    } catch (err) {
      console.error('Failed to submit donation:', err);
      setError('Failed to submit donation to the server.');
      setDonationStatus('ANALYZED');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hotel Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name || 'Hotel Partner'}. Rescuing food waste using AI.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="card px-6 py-3 bg-emerald-50 border-emerald-100 flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">{stats.mealsDonated}</div>
             <div className="text-sm">
                <p className="font-bold text-emerald-800">Surplus Meals Donated</p>
                <p className="text-emerald-600 font-medium">To Date</p>
             </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Donations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.activeDonations}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Meals Rescued</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.mealsDonated}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Successful Pickups</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.successfulPickups}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">NGOs Helped</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.ngosHelped}</p>
        </div>
        <div className="card p-4 text-center bg-emerald-50 border-emerald-200 col-span-2 md:col-span-1">
          <p className="text-xs text-emerald-700 uppercase tracking-wider font-bold">CO2 Savings</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.carbonSaved} kg</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donation Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Package size={20} className="text-emerald-600" />
              New Donation
            </h2>

            {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-semibold border border-rose-100 mb-4">{error}</div>}

            {donationStatus === 'SUBMITTED' ? (
              <div className="py-12 text-center space-y-4 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Donation Successful!</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Your surplus food has been registered. AI recommended NGOs have been compiled and matched.
                </p>
                <button 
                  onClick={() => {setDonationStatus('IDLE'); setAnalysisResult(null); setUploadedFile(null); setRecommendedNgos([]); setError('');}} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
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
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : analysisResult 
                    ? 'border-emerald-200 bg-emerald-50/5' 
                    : 'border-slate-300 hover:border-emerald-500'
                  }`}
                >
                  {!analysisResult ? (
                    <div className="space-y-4">
                      {analyzing ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
                          <p className="text-emerald-700 font-medium animate-pulse text-sm">AI Food Recognition processing...</p>
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
                          <label htmlFor="food-upload" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-2 transition-all">
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
                           <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                           <p className="text-[11px] text-emerald-800 leading-relaxed">AI analysis is automated. Correct the values below if needed before submitting.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Classification</label>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-extrabold text-slate-900">{analysisResult.foodType}</p>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles size={12} /> {Math.round(analysisResult.confidence * 100)}% Match
                            </span>
                          </div>
                          <p className="text-emerald-600 text-sm font-semibold">{analysisResult.category}</p>
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
                            <p className="text-xl font-bold text-slate-900">{estimatedServings || analysisResult.servings}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">AI Safety Recommendation</p>
                          <p className="text-xs text-emerald-700 leading-relaxed font-medium">{analysisResult.recommendation}</p>
                        </div>

                        {/* Interactive Quantity Form */}
                        <form onSubmit={handleRecalculate} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modify Food Type & Quantity</label>
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
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            {estimating ? <RefreshCw className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                            <span>Recalculate AI Servings & Match NGOs</span>
                          </button>
                        </form>

                        {/* AI Recommended NGOs List */}
                        {recommendedNgos.length > 0 && (
                          <div className="space-y-2 animate-in fade-in duration-300">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <ThumbsUp size={12} className="text-emerald-600" /> Top AI NGO Recommendations
                            </label>
                            <div className="space-y-2">
                              {recommendedNgos.map((ngo, idx) => (
                                <div key={ngo.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-emerald-600/30 transition-all shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-extrabold">{idx + 1}</div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800">{ngo.name}</p>
                                      <p className="text-[10px] text-slate-400">{ngo.distanceKm} km away • {ngo.capacity.toLowerCase()} capacity</p>
                                    </div>
                                  </div>
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10"
                          >
                            {donationStatus === 'SUBMITTING' ? 'Registering surplus...' : 'Confirm Surplus Donation'}
                          </button>
                          <button 
                            onClick={() => { setAnalysisResult(null); setUploadedFile(null); setRecommendedNgos([]); setError(''); }} 
                            className="text-slate-400 text-xs font-semibold w-full text-center mt-3 hover:text-slate-600 transition-colors"
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
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="card p-6">
             <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-emerald-600" />
                Impact Summary
             </h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Meals Donated</span>
                  <span className="font-bold text-slate-900">{stats.mealsDonated} servings</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Food Rescued</span>
                  <span className="font-bold text-slate-900">{(stats.mealsDonated * 0.5).toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">CO2 Impact Avoided</span>
                  <span className="font-bold text-emerald-600">{stats.carbonSaved} kg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">NGOs Connected</span>
                  <span className="font-bold text-blue-600">{stats.ngosHelped} partners</span>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full" style={{ width: `${Math.min(100, (stats.mealsDonated / 200) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-widest font-bold">Progress toward 200 surplus meals</p>
                </div>
             </div>
          </div>

          <div className="card p-6 bg-slate-900 text-white">
             <h3 className="text-lg font-bold mb-4">Safety & Guidelines</h3>
             <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
               <p><strong>1. Temperature Checks:</strong> Keep prepared meals below 4°C or above 60°C until pickup.</p>
               <p><strong>2. Proper Packaging:</strong> Seal food in single-use food-grade containers.</p>
               <p><strong>3. AI Verification:</strong> Take clear, well-lit photos of the food for accurate freshness scoring.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDashboard;
