import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Map as MapIcon, History, TrendingUp, Search, CheckCircle2, User, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const NGODashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donations, setDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    availableDonations: 0,
    acceptedDonations: 0,
    mealsDistributed: 0,
    activeVolunteers: 5
  });

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

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:8080/api/donations/ngo/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching NGO stats:', err);
    }
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
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDonations();
  }, []);

  const handleAcceptDonation = async (donationId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/donations/${donationId}/status?status=ACCEPTED`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedDonation(null);
      fetchStats();
      fetchDonations();
    } catch (err) {
      console.error('Error accepting donation:', err);
      alert('Failed to accept donation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async (donationId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/donations/${donationId}/status?status=DELIVERED`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStats();
      fetchDonations();
    } catch (err) {
      console.error('Error delivering donation:', err);
      alert('Failed to update status to delivered.');
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = user?.latitude && user?.longitude 
    ? [user.latitude, user.longitude] 
    : [12.9716, 77.5946]; // Default to Bangalore center

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
             className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'map' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <MapIcon size={18} />
             <span>Map View</span>
           </button>
           <button 
             onClick={() => setActiveTab('list')}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <History size={18} />
             <span>Active Requests ({myDonations.filter(d => d.status === 'ACCEPTED').length})</span>
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Statistics */}
        <div className="space-y-6">
           <div className="card p-6 bg-gradient-to-br from-brand-primary to-emerald-600 text-white border-none">
              <TrendingUp className="mb-4 opacity-80" />
              <p className="text-sm font-medium opacity-80">Surplus Meals Rescued</p>
              <h3 className="text-3xl font-bold">{stats.mealsDistributed}</h3>
              <p className="text-xs mt-1 opacity-80">Total servings delivered to people</p>
           </div>

           <div className="card p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Accepted Pickups</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.acceptedDonations}</p>
           </div>

           <div className="card p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Available Surplus Nearby</p>
              <p className="text-2xl font-bold text-brand-primary mt-1">{stats.availableDonations}</p>
           </div>

           <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Active Volunteers</h3>
              <div className="space-y-3">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                         {String.fromCharCode(64+i)}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-700">Volunteer {i}</p>
                         <p className="text-[10px] text-emerald-500 font-bold uppercase">Active</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 card min-h-[600px] flex flex-col">
          {activeTab === 'map' ? (
            <div className="flex-grow relative rounded-xl overflow-hidden min-h-[500px]">
               <MapContainer center={mapCenter} zoom={12} className="h-full w-full z-0 min-h-[500px]">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {donations.map(don => (
                    <Marker key={don.id} position={[don.latitude || 12.9716, don.longitude || 77.5946]}>
                      <Popup>
                        <div className="p-1 min-w-[150px]">
                          <p className="font-bold text-slate-950">{don.foodType}</p>
                          <p className="text-xs text-slate-600 mt-1 font-semibold">{don.quantity} servings</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{don.pickupAddress}</p>
                          <button 
                            className="btn btn-primary w-full text-[10px] py-1.5 mt-2"
                            onClick={() => setSelectedDonation(don)}
                          >
                            Select Donation
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
               </MapContainer>

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
                       <button onClick={() => setSelectedDonation(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
                    </div>
                    <div className="space-y-3 mb-6">
                       <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">{selectedDonation.description}</p>
                       <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapIcon size={14} className="text-brand-primary shrink-0" />
                          <span>Pickup: {selectedDonation.pickupAddress}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleAcceptDonation(selectedDonation.id)} 
                      disabled={loading}
                      className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                       {loading ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />}
                       <span>Accept Surplus & Dispatch Pickup</span>
                    </button>
                 </div>
               )}
            </div>
          ) : (
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
                               onClick={() => handleCompleteDelivery(don.id)}
                               className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                             >
                               <CheckCircle2 size={12} />
                               <span>Confirm Handover</span>
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
    </div>
  );
};

export default NGODashboard;
