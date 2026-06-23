import { useState, useEffect } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users, Truck, CheckCircle, Loader2, Eye, Sparkles, ThumbsUp, Activity } from 'lucide-react';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'ai-insights', 'ai-logs'
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHotels: 0,
    totalNgos: 0,
    totalDonations: 0,
    foodSavedKg: 0,
    peopleFed: 0
  });
  const [ngos, setNgos] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [aiAnalytics, setAiAnalytics] = useState({
    totalPredictions: 0,
    mostDonatedFoodTypes: {},
    averageServings: 0,
    mostActiveNgos: {},
    wasteTrends: {}
  });
  const [loading, setLoading] = useState(false);
  const [showRawLog, setShowRawLog] = useState(null);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Stats
      const statsRes = await axios.get('http://localhost:8080/api/admin/stats', { headers });
      setStats(statsRes.data);

      // 2. Fetch NGOs
      const ngosRes = await axios.get('http://localhost:8080/api/admin/ngos', { headers });
      setNgos(ngosRes.data);

      // 3. Fetch Users
      const usersRes = await axios.get('http://localhost:8080/api/admin/users', { headers });
      setUsersList(usersRes.data);

      // 4. Fetch AI Logs
      const logsRes = await axios.get('http://localhost:8080/api/admin/ai-logs', { headers });
      setAiLogs(logsRes.data);

      // 5. Fetch AI Insights Analytics
      try {
        const aiRes = await axios.get('http://localhost:8080/api/ai/analytics', { headers });
        setAiAnalytics(aiRes.data);
      } catch (aiErr) {
        console.error('Error fetching AI analytics:', aiErr);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApproveNgo = async (ngoId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/admin/approve-ngo/${ngoId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      console.error('NGO approval failed:', err);
      alert('Failed to approve NGO.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectNgo = async (ngoId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/admin/reject-ngo/${ngoId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      console.error('NGO rejection failed:', err);
      alert('Failed to reject NGO.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/admin/suspend-user/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      console.error('User suspension failed:', err);
      alert('Failed to suspend user.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateUser = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/admin/users/${userId}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      console.error('User reactivation failed:', err);
      alert('Failed to reactivate user.');
    } finally {
      setLoading(false);
    }
  };

  const pendingNgos = ngos.filter(ngo => ngo.approvalStatus === 'PENDING');

  // Overview growth chart (Simulated and historical data)
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Surplus Food Saved (kg)',
      data: [30, 45, 60, 80, 110, stats.foodSavedKg > 0 ? stats.foodSavedKg : 125],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // Role distribution pie chart
  const statusData = {
    labels: ['Hotels', 'NGOs', 'Admins'],
    datasets: [{
      data: [stats.totalHotels || 2, stats.totalNgos || 2, 1],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      hoverOffset: 4
    }]
  };

  // --- AI INSIGHTS CHART CONFIGURATIONS ---
  const foodTypesLabels = Object.keys(aiAnalytics.mostDonatedFoodTypes || {});
  const foodTypesData = Object.values(aiAnalytics.mostDonatedFoodTypes || {});
  
  const foodTypesChartData = {
    labels: foodTypesLabels.length ? foodTypesLabels : ['No Data'],
    datasets: [{
      data: foodTypesData.length ? foodTypesData : [1],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'],
      hoverOffset: 4
    }]
  };

  const activeNgoLabels = Object.keys(aiAnalytics.mostActiveNgos || {});
  const activeNgoData = Object.values(aiAnalytics.mostActiveNgos || {});
  
  const activeNgosChartData = {
    labels: activeNgoLabels,
    datasets: [{
      label: 'Recommendation Match Count',
      data: activeNgoData,
      backgroundColor: '#3b82f6',
      borderRadius: 8
    }]
  };

  const wasteTrendsLabels = Object.keys(aiAnalytics.wasteTrends || {});
  const wasteTrendsData = Object.values(aiAnalytics.wasteTrends || {});
  
  const wasteTrendsChartData = {
    labels: wasteTrendsLabels,
    datasets: [{
      label: 'AI Predictions / Day',
      data: wasteTrendsData,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Controls (Admin)</h1>
          <p className="text-slate-500 font-medium">Monitoring platform memberships, approvals, and MongoDB AI analytics.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab('users')}
             className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
           >
             User Control
           </button>
           <button 
             onClick={() => setActiveTab('ai-insights')}
             className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'ai-insights' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
           >
             AI Insights
           </button>
           <button 
             onClick={() => setActiveTab('ai-logs')}
             className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'ai-logs' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
           >
             AI Log Audit
           </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
            <h3 className="text-3xl font-bold text-slate-900">{stats.totalUsers}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Donations</p>
            <h3 className="text-3xl font-bold text-slate-900">{stats.totalDonations}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Truck size={24} />
          </div>
        </div>
        <div className="card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Food Saved</p>
            <h3 className="text-3xl font-bold text-emerald-600">{stats.foodSavedKg} kg</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">People Impacted</p>
            <h3 className="text-3xl font-bold text-indigo-600">~{stats.peopleFed}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card p-8">
               <h3 className="text-lg font-bold text-slate-900 mb-8">Redistribution Growth</h3>
               <div className="h-[350px]">
                 <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
               </div>
            </div>

            <div className="card p-8">
               <h3 className="text-lg font-bold text-slate-900 mb-8">Role Distribution</h3>
               <div className="h-[300px] flex items-center justify-center">
                 <Pie data={statusData} />
               </div>
            </div>
          </div>

          {/* NGO Verification Queue */}
          <div className="card overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-bold text-slate-900">NGO Verification Queue</h3>
               <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                 {pendingNgos.length} Pending Approval
               </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                   <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-4">Organization Name</th>
                      <th className="px-8 py-4">Registration #</th>
                      <th className="px-8 py-4">Service Area</th>
                      <th className="px-8 py-4">Contact</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {pendingNgos.map(ngo => (
                     <tr key={ngo.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-900">{ngo.ngoName}</td>
                        <td className="px-8 py-5 text-sm text-slate-600">{ngo.registrationNumber}</td>
                        <td className="px-8 py-5 text-sm text-slate-500">{ngo.serviceArea}</td>
                        <td className="px-8 py-5 text-sm text-slate-400">{ngo.user?.email || 'N/A'}</td>
                        <td className="px-8 py-5 text-right">
                           <button 
                             onClick={() => handleApproveNgo(ngo.id)}
                             className="text-emerald-600 font-bold text-sm hover:underline mr-4 disabled:opacity-50"
                             disabled={loading}
                           >
                             Approve
                           </button>
                           <button 
                             onClick={() => handleRejectNgo(ngo.id)}
                             className="text-red-500 font-bold text-sm hover:underline disabled:opacity-50"
                             disabled={loading}
                           >
                             Reject
                           </button>
                        </td>
                     </tr>
                   ))}
                   {pendingNgos.length === 0 && (
                     <tr>
                       <td colSpan="5" className="py-8 text-center text-slate-400">All registered NGO accounts are fully audited and processed.</td>
                     </tr>
                   )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-xl font-bold text-slate-900">Platform User Control</h3>
             <p className="text-xs text-slate-500 mt-1">Suspend, reactivate, or audit all platform memberships</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                 <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">User Details</th>
                    <th className="px-8 py-4">System Role</th>
                    <th className="px-8 py-4">Contact Phone</th>
                    <th className="px-8 py-4">Verification</th>
                    <th className="px-8 py-4">Account Status</th>
                    <th className="px-8 py-4 text-right">Access Controls</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {usersList.map(usr => (
                   <tr key={usr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900">{usr.name}</p>
                        <p className="text-xs text-slate-400">{usr.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          usr.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                          usr.role === 'HOTEL' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-500">{usr.phone || 'N/A'}</td>
                      <td className="px-8 py-5 text-sm">
                        {usr.verified ? (
                          <span className="text-emerald-600 font-medium">✓ Verified</span>
                        ) : (
                          <span className="text-slate-400">Unverified</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          usr.accountStatus === 'ACTIVE' || usr.accountStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          usr.accountStatus === 'SUSPENDED' ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {usr.accountStatus}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {usr.role !== 'ADMIN' && (
                          <>
                            {usr.accountStatus !== 'SUSPENDED' ? (
                              <button 
                                onClick={() => handleSuspendUser(usr.id)}
                                className="text-red-600 font-bold text-sm hover:underline mr-4"
                                disabled={loading}
                              >
                                Suspend Account
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleReactivateUser(usr.id)}
                                className="text-emerald-600 font-bold text-sm hover:underline mr-4"
                                disabled={loading}
                              >
                                Reactivate
                              </button>
                            )}
                          </>
                        )}
                        {usr.role === 'ADMIN' && (
                          <span className="text-xs text-slate-400 italic">Self (Unmodifiable)</span>
                        )}
                      </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ai-insights' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* AI Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 flex items-center justify-between bg-emerald-50 border-emerald-100">
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total AI Predictions Logged</p>
                <h3 className="text-3xl font-black text-emerald-950">{aiAnalytics.totalPredictions}</h3>
                <p className="text-[10px] text-emerald-600 font-semibold">MongoDB / SQLite logs analyzed</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
                <Activity size={24} />
              </div>
            </div>
            <div className="card p-6 flex items-center justify-between bg-blue-50 border-blue-100">
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Average Servings / Donation</p>
                <h3 className="text-3xl font-black text-blue-950">{aiAnalytics.averageServings} meals</h3>
                <p className="text-[10px] text-blue-600 font-semibold">FastAPI estimated output</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold">AVG</div>
            </div>
          </div>

          {/* AI Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Most Donated Food Types</h3>
              <div className="h-[280px] flex items-center justify-center">
                {foodTypesLabels.length > 0 ? (
                  <Pie data={foodTypesChartData} />
                ) : (
                  <p className="text-slate-400 text-sm">No classification data recorded yet.</p>
                )}
              </div>
            </div>

            <div className="card p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-1.5">
                <ThumbsUp size={18} className="text-blue-500" /> AI Proximity NGO Recommendations
              </h3>
              <div className="h-[280px] flex items-center justify-center">
                {activeNgoLabels.length > 0 ? (
                  <Bar 
                    data={activeNgosChartData} 
                    options={{ 
                      maintainAspectRatio: false, 
                      indexAxis: 'y',
                      plugins: { legend: { display: false } }
                    }} 
                  />
                ) : (
                  <p className="text-slate-400 text-sm">No recommendation logs recorded yet.</p>
                )}
              </div>
            </div>

            <div className="card p-8 lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Food Waste Reduction Trends</h3>
              <div className="h-[300px]">
                {wasteTrendsLabels.length > 0 ? (
                  <Line 
                    data={wasteTrendsChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } }
                    }} 
                  />
                ) : (
                  <p className="text-slate-400 text-sm text-center py-20">No trend log data recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai-logs' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="card overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-xl font-bold text-slate-900">AI Recognition Prediction Logs</h3>
               <p className="text-xs text-slate-500 mt-1">Audit log predictions from Python FastAPI TensorFlow/OpenCV stack</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                   <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-4">Log ID</th>
                      <th className="px-8 py-4">Food Surplus Item</th>
                      <th className="px-8 py-4">Freshness Score</th>
                      <th className="px-8 py-4">Servings</th>
                      <th className="px-8 py-4">Timestamp</th>
                      <th className="px-8 py-4 text-right">Raw Output</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {aiLogs.map((log, idx) => (
                     <tr key={log.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-xs text-slate-500 font-mono">
                          {log.id ? `${log.id.substring(0, 8)}...` : `LOG-${1000 + idx}`}
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-800">{log.foodType}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{log.category}</p>
                        </td>
                        <td className="px-8 py-5 font-bold text-emerald-600">{log.freshnessScore}%</td>
                        <td className="px-8 py-5 text-sm text-slate-700 font-semibold">{log.estimatedServings}</td>
                        <td className="px-8 py-5 text-xs text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => setShowRawLog(log.predictionRaw || JSON.stringify(log, null, 2))}
                            className="btn bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-1.5 px-3 inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>Audit Raw Data</span>
                          </button>
                        </td>
                     </tr>
                   ))}
                   {aiLogs.length === 0 && (
                     <tr>
                       <td colSpan="6" className="py-8 text-center text-slate-400">No AI predictions logged in database yet. Try uploading a food image on the Hotel dashboard.</td>
                     </tr>
                   )}
                </tbody>
              </table>
            </div>
          </div>

          {showRawLog && (
            <div className="card p-6 bg-slate-900 text-slate-200 font-mono text-xs relative space-y-4 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-amber-500 font-bold uppercase tracking-wider">Audit Log Payload</span>
                <button onClick={() => setShowRawLog(null)} className="text-slate-400 hover:text-white text-sm font-bold">Close ✕</button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">{showRawLog}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
