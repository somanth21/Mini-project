import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Award, Heart, Leaf, FileText, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ImpactDashboard = () => {
  const [timeFilter, setTimeFilter] = useState('month');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/impact/metrics?timeFilter=${timeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching impact metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeFilter]);

  const handleDownloadReport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/reports/impact?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `feedlink_social_impact_report.${format}`;
      link.click();
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  if (!metrics) {
    return (
      <div className="h-60 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Award className="text-brand-primary" size={22} />
            Real Social Impact
          </h2>
          <p className="text-xs text-slate-500">Track dynamic meals saved, CO₂ prevented, and partner performance</p>
        </div>

        {/* Filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['today', 'week', 'month', 'year'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                timeFilter === filter ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50 flex items-start space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 flex-shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 block">Meals Saved</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block">{metrics.mealsSaved}</span>
            <span className="text-[9px] text-emerald-600 block mt-0.5">{metrics.peopleFed} People Fed</span>
          </div>
        </div>

        <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50 flex items-start space-x-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 block">Food Rescued</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block">{metrics.foodRescuedKg} kg</span>
            <span className="text-[9px] text-indigo-600 block mt-0.5">{metrics.completedDonations} Completed</span>
          </div>
        </div>

        <div className="bg-teal-50/30 p-4 rounded-2xl border border-teal-50 flex items-start space-x-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-100 flex-shrink-0">
            <Leaf size={20} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 block">CO₂ Saved</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block">{metrics.co2SavedKg} kg</span>
            <span className="text-[9px] text-teal-600 block mt-0.5">Greenhouse Gas Avoided</span>
          </div>
        </div>

        <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-50 flex items-start space-x-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-100 flex-shrink-0">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 block">Success Rate</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block">{metrics.successRate}%</span>
            <span className="text-[9px] text-amber-600 block mt-0.5">{metrics.activeNgos} NGOs / {metrics.activeHotels} Hotels & Hostals</span>
          </div>
        </div>
      </div>

      {/* Trend Graph & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
        {/* Graph */}
        <div className="lg:col-span-2 space-y-2">
          <h4 className="text-xs font-bold text-slate-700">Donation Redemption Trends</h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Line type="monotone" dataKey="meals" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports Download Card */}
        <div className="bg-slate-50 p-5 rounded-2xl flex flex-col justify-between border border-slate-100">
          <div>
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText size={16} className="text-indigo-500" />
              Download Impact Reports
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Export verified social impact metrics, including meals rescued, carbon savings, and participant contributions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => handleDownloadReport('pdf')}
              className="btn btn-secondary flex items-center justify-center gap-1 text-[10px] py-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            >
              <Download size={12} />
              PDF Report
            </button>
            <button
              onClick={() => handleDownloadReport('csv')}
              className="btn btn-secondary flex items-center justify-center gap-1 text-[10px] py-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
            >
              <Download size={12} />
              CSV Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
