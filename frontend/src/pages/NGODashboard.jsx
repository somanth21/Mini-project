import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Map as MapIcon, History, TrendingUp, Search, CheckCircle2, User, Loader2, Sparkles, QrCode, X, Flame } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import ImpactDashboard from '../components/ImpactDashboard';

const NGODashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donations, setDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [ngoLocations, setNgoLocations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [showNgos, setShowNgos] = useState(true);
  const [showCoverage, setShowCoverage] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyDonationId, setVerifyDonationId] = useState(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [expectedToken, setExpectedToken] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);


  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [correctedLabel, setCorrectedLabel] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!correctedLabel || !selectedDonation) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/ai/feedback', {
        originalPrediction: selectedDonation.foodType,
        correctLabel: correctedLabel,
        userRole: 'NGO'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackSubmitted(true);
      setSelectedDonation(prev => ({ ...prev, foodType: correctedLabel }));
    } catch (err) {
      console.error('Failed to submit correction feedback:', err);
    }
  };

  const fetchStats = async () => {
    // Relying on the dynamic ImpactDashboard for main KPIs
  };

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Fetch available donations for the map
        const availRes = await axios.get('http://localhost:8080/api/donations/available', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDonations(availRes.data);

        // Fetch my accepted/completed donations
        const myRes = await axios.get('http://localhost:8080/api/donations/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyDonations(myRes.data);

        // Fetch heatmap data
        const heatRes = await axios.get('http://localhost:8080/api/maps/heatmap', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHeatmapData(heatRes.data);

        // Fetch active NGO locations
        const ngoRes = await axios.get('http://localhost:8080/api/maps/ngos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNgoLocations(ngoRes.data);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    }
  };


  useEffect(() => {
    fetchDonations();
  }, []);

  const haversine = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const selectedDistance = selectedDonation 
    ? haversine(user?.latitude, user?.longitude, selectedDonation.latitude, selectedDonation.longitude)
    : null;

  const handleAcceptDonation = async (donationId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/donations/${donationId}/status?status=ACCEPTED`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedDonation(null);
      fetchDonations();
    } catch (err) {
      console.error('Error accepting donation:', err);
      alert('Failed to accept donation.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerifyModal = (donation) => {
    setVerifyDonationId(donation.id);
    // Provide expected token for testing convenience
    setExpectedToken(donation.verificationToken || `FEEDLINK-QR-${donation.id}-XXXX`);
    setVerifyToken('');
    setVerifyError('');
    setVerifySuccess(false);
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyToken.trim()) return;
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/donations/${verifyDonationId}/verify-qr?token=${verifyToken.trim()}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerifySuccess(true);
      setTimeout(() => {
        setShowVerifyModal(false);
        fetchDonations();
      }, 1500);
    } catch (err) {
      console.error('QR verification failed:', err);
      setVerifyError(err.response?.data?.message || 'Invalid verification token. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const mapCenter = user?.latitude && user?.longitude 
    ? [user.latitude, user.longitude] 
    : [17.4300, 78.4000]; // Default to Hyderabad center

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">NGO Impact Hub</h1>
          <p className="text-slate-500 text-lg">Logged in as {user?.name || 'NGO Partner'}. Scale surplus food redistribution.</p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('map')}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${activeTab === 'map' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <MapIcon size={16} />
             <span>Map View</span>
           </button>
           <button 
             onClick={() => setActiveTab('heatmap')}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${activeTab === 'heatmap' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Flame size={16} />
             <span>Heatmap View</span>
           </button>
           <button 
             onClick={() => setActiveTab('list')}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${activeTab === 'list' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <History size={16} />
             <span>Active Requests ({myDonations.filter(d => d.status === 'ACCEPTED').length})</span>
           </button>
        </div>
      </header>

      {/* Real Impact Section */}
      <ImpactDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info Card */}
        <div className="space-y-6">
           <div className="card p-6 bg-slate-900 text-white rounded-3xl">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Active Volunteers</h3>
              <div className="space-y-3">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300">
                         {String.fromCharCode(64+i)}
                       </div>
                       <div>
                         <p className="text-sm font-bold">Volunteer {i}</p>
                         <p className="text-[10px] text-emerald-400 font-bold uppercase">Active</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 card min-h-[550px] flex flex-col bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          {activeTab === 'map' && (
            <div className="flex flex-col flex-grow relative rounded-xl overflow-hidden min-h-[500px]">
               {/* Map Filters Panel */}
               <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between z-[500]">
                  <div className="flex flex-wrap gap-4 items-center">
                     {/* Status Filter */}
                     <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
                        <select 
                           value={filterStatus} 
                           onChange={e => setFilterStatus(e.target.value)}
                           className="select select-sm select-bordered text-xs rounded-xl w-36 bg-white border-slate-200"
                        >
                           <option value="ALL">All Donations</option>
                           <option value="AVAILABLE">Available</option>
                           <option value="ACCEPTED">Accepted / Claimed</option>
                           <option value="DELIVERED">Delivered</option>
                        </select>
                     </div>
                     
                     {/* Date Filter */}
                     <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Period</label>
                        <select 
                           value={filterDate} 
                           onChange={e => setFilterDate(e.target.value)}
                           className="select select-sm select-bordered text-xs rounded-xl w-36 bg-white border-slate-200"
                        >
                           <option value="ALL">All Time</option>
                           <option value="TODAY">Last 24 Hours</option>
                           <option value="WEEK">Last 7 Days</option>
                        </select>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                     {/* Toggle NGO Overlay */}
                     <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={showNgos} 
                           onChange={e => setShowNgos(e.target.checked)}
                           className="checkbox checkbox-sm checkbox-primary rounded-lg"
                        />
                        <span>Show NGOs</span>
                     </label>

                     {/* Toggle Coverage Overlay */}
                     <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={showCoverage} 
                           onChange={e => setShowCoverage(e.target.checked)}
                           className="checkbox checkbox-sm checkbox-primary rounded-lg"
                        />
                        <span>Coverage Zone (5km)</span>
                     </label>
                  </div>
               </div>

               <div className="flex-grow relative min-h-[450px]">
                  <MapContainer center={mapCenter} zoom={13} className="h-full w-full z-0 min-h-[450px]">
                     <TileLayer
                       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                     />
                     
                     {/* Plotting Filtered Donations */}
                     {[...donations, ...myDonations].filter(don => {
                        if (filterStatus !== 'ALL' && don.status !== filterStatus) return false;
                        if (filterDate !== 'ALL' && don.createdAt) {
                           const created = new Date(don.createdAt);
                           const now = new Date();
                           if (filterDate === 'TODAY' && (now - created) > 24 * 60 * 60 * 1000) return false;
                           if (filterDate === 'WEEK' && (now - created) > 7 * 24 * 60 * 60 * 1000) return false;
                        }
                        return true;
                     }).map(don => (
                       <Marker key={don.id} position={[don.latitude || 17.4300, don.longitude || 78.4000]}>
                         <Popup>
                           <div className="p-1 min-w-[150px]">
                             <p className="font-bold text-slate-950">{don.foodType}</p>
                             <p className="text-xs text-slate-600 mt-1 font-semibold">{don.quantity} servings</p>
                             <p className="text-[10px] text-slate-400 mt-0.5">{don.pickupAddress}</p>
                             <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1.5 uppercase ${
                               don.status === 'AVAILABLE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                               (don.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200')
                             }`}>
                               {don.status}
                             </span>
                             {don.status === 'AVAILABLE' && (
                               <button 
                                 className="btn btn-primary w-full text-[10px] py-1.5 mt-2 cursor-pointer"
                                 onClick={() => setSelectedDonation(don)}
                               >
                                 Select Donation
                               </button>
                             )}
                           </div>
                         </Popup>
                       </Marker>
                     ))}

                     {/* Plotting NGOs */}
                     {showNgos && ngoLocations.map((ngo, idx) => (
                       <Marker key={`ngo-${idx}`} position={[ngo.latitude, ngo.longitude]}>
                         <Popup>
                           <div className="p-2 space-y-1">
                             <h4 className="font-bold text-xs text-indigo-700">{ngo.name}</h4>
                             <p className="text-[10px] text-slate-500 font-semibold">{ngo.address}</p>
                             <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full inline-block mt-1 font-bold">
                               NGO Partner
                             </span>
                           </div>
                         </Popup>
                       </Marker>
                     ))}

                     {/* Plotting NGO Coverage Circles */}
                     {showCoverage && ngoLocations.map((ngo, idx) => (
                       <Circle
                         key={`cov-${idx}`}
                         center={[ngo.latitude, ngo.longitude]}
                         radius={5000}
                         pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.1, weight: 1.5 }}
                       />
                     ))}
                  </MapContainer>
               </div>


               {/* Map Overlay for Details */}
               {selectedDonation && (
                 <div className="absolute bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white shadow-2xl rounded-2xl border border-slate-200 z-[1000] p-6 animate-in slide-in-from-bottom-8">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <h4 className="font-bold text-xl text-slate-900">{selectedDonation.foodType}</h4>
                          <p className="text-sm text-brand-primary font-bold">{selectedDonation.quantity} Servings ({selectedDonation.category})</p>
                          {selectedDistance !== null && (
                            <p className="text-[11px] text-slate-500 font-bold mt-0.5">{selectedDistance.toFixed(1)} km away from you</p>
                          )}
                          {selectedDistance !== null && selectedDistance < 5.0 && (
                            <span className="mt-1.5 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <Sparkles size={10} className="text-emerald-600 animate-pulse" /> AI Recommended Match
                            </span>
                          )}
                       </div>
                       <button onClick={() => { setSelectedDonation(null); setFeedbackSubmitted(false); setCorrectedLabel(''); setShowFeedbackForm(false); }} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
                    </div>
                    <div className="space-y-3 mb-6">
                       <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">{selectedDonation.description}</p>
                       
                       <div className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Feedback Learning</span>
                            {!feedbackSubmitted && (
                              <button 
                                type="button"
                                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                                className="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold underline cursor-pointer"
                              >
                                {showFeedbackForm ? "Cancel" : "Incorrect label?"}
                              </button>
                            )}
                          </div>
                          {feedbackSubmitted ? (
                            <p className="text-[10px] text-emerald-600 font-bold">✓ Correction recorded. Thanks!</p>
                          ) : (
                            showFeedbackForm && (
                              <form onSubmit={handleFeedbackSubmit} className="flex gap-2 items-center mt-1 animate-in slide-in-from-top-2">
                                <select 
                                  value={correctedLabel}
                                  onChange={(e) => setCorrectedLabel(e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] text-slate-800 focus:outline-none flex-grow"
                                >
                                  <option value="">-- Correct label --</option>
                                  {["Biryani", "Rice", "Bread", "Curry", "Fruits", "Vegetables"].map(label => (
                                    <option key={label} value={label}>{label}</option>
                                  ))}
                                </select>
                                <button 
                                  type="submit" 
                                  disabled={!correctedLabel}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg cursor-pointer border-none"
                                >
                                  Submit
                                </button>
                              </form>
                            )
                          )}
                        </div>
                       
                       <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapIcon size={14} className="text-brand-primary shrink-0" />
                          <span>Pickup: {selectedDonation.pickupAddress}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleAcceptDonation(selectedDonation.id)} 
                      disabled={loading}
                      className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
                    >
                       {loading ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />}
                       <span>Accept Surplus & Dispatch Pickup</span>
                    </button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="flex-grow relative rounded-xl overflow-hidden min-h-[500px]">
               <MapContainer center={mapCenter} zoom={13} className="h-full w-full z-0 min-h-[500px]">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {heatmapData.map((item, idx) => {
                    const radius = Math.min(800, Math.max(150, item.foodWeight * 8));
                    const color = item.foodWeight > 30 ? '#ef4444' : (item.foodWeight > 10 ? '#f97316' : '#eab308');
                    return (
                      <Circle
                        key={idx}
                        center={[item.latitude, item.longitude]}
                        radius={radius}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 1.5 }}
                      >
                        <Popup>
                          <div className="p-2 space-y-1">
                            <h4 className="font-bold text-xs text-slate-900">Neighborhood Density</h4>
                            <p className="text-[10px] text-slate-600">Donations Count: <span className="font-bold">{item.donationCount}</span></p>
                            <p className="text-[10px] text-slate-600">Total Food Wasted: <span className="font-bold">{item.foodWeight} kg</span></p>
                            <p className="text-[10px] text-slate-600">Rescued Deliveries: <span className="font-bold">{item.completedDeliveries}</span></p>
                            <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full inline-block mt-1 uppercase font-bold">
                              {item.foodWeight > 30 ? 'High Hotspot' : 'Moderate Activity'}
                            </span>
                          </div>
                        </Popup>
                      </Circle>
                    );
                  })}
               </MapContainer>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="p-8">
               <h3 className="text-xl font-bold text-slate-900 mb-6">Redistribution Log</h3>
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="text-left border-b border-slate-100 italic text-slate-400 text-sm">
                       <th className="pb-4 font-medium">Food Surplus</th>
                       <th className="pb-4 font-medium">Servings</th>
                       <th className="pb-4 font-medium">Location</th>
                       <th className="pb-4 font-medium">Status</th>
                       <th className="pb-4 font-medium">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {myDonations.map(don => (
                       <tr key={don.id} className="group">
                         <td className="py-4 font-bold text-slate-700">{don.foodType}</td>
                         <td className="py-4 text-slate-500">{don.quantity} servings</td>
                         <td className="py-4 text-slate-400 text-xs">{don.pickupAddress}</td>
                         <td className="py-4 font-semibold">
                           <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider ${
                             don.status === 'DELIVERED' 
                             ? 'bg-emerald-100 text-emerald-700' 
                             : 'bg-amber-100 text-amber-700 animate-pulse'
                           }`}>
                             {don.status}
                           </span>
                         </td>
                         <td className="py-4">
                           {don.status === 'ACCEPTED' && (
                             <button
                               onClick={() => handleOpenVerifyModal(don)}
                               className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-md"
                             >
                               <QrCode size={12} />
                               <span>Scan / Verify Handover</span>
                             </button>
                           )}
                           {don.status === 'DELIVERED' && (
                             <span className="text-xs text-slate-400">Completed</span>
                           )}
                         </td>
                       </tr>
                     ))}
                     {myDonations.length === 0 && (
                       <tr>
                         <td colSpan="5" className="py-12 text-center text-slate-400">No accepted donations recorded yet. Go to the map view to accept.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4 animate-in zoom-in duration-300">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="text-center">
              <QrCode className="text-indigo-500 mx-auto" size={32} />
              <h3 className="text-lg font-bold text-slate-800 mt-2">Verify Handover</h3>
              <p className="text-xs text-slate-500 mt-1">Scan the QR code displayed on the Hotel and Hostals dashboard or enter the verification token.</p>
            </div>

            {verifySuccess ? (
              <div className="py-6 text-center space-y-2 text-emerald-600 animate-pulse">
                <CheckCircle2 className="mx-auto" size={40} />
                <p className="font-bold text-sm">Verification Successful!</p>
                <p className="text-xs text-slate-400">Donation delivery completed.</p>
              </div>
            ) : (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                {verifyError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-xl border border-rose-100">
                    {verifyError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Token</label>
                  <input
                    type="text"
                    required
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="FEEDLINK-QR-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Seeded Test Token</span>
                  <div className="flex justify-between items-center mt-1">
                    <code className="text-[10px] text-slate-600 font-bold select-all">{expectedToken}</code>
                    <button
                      type="button"
                      onClick={() => setVerifyToken(expectedToken)}
                      className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold hover:bg-indigo-100 cursor-pointer"
                    >
                      Use Test Token
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                >
                  {verifyLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  <span>Complete Verification</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NGODashboard;
