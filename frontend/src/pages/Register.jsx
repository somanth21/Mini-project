import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, User, MapPin, ShieldCheck, Loader2, Phone, Building, FileText, Globe, Heart, CheckCircle2, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'HOTEL',
    address: '',
    phone: '',
    hotelName: '',
    ngoName: '',
    registrationNumber: '',
    serviceArea: '',
    latitude: 12.9716, // Default fallback coordinates
    longitude: 77.5946
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    // Auto-populate role-specific names if empty
    const payload = { ...formData };
    if (payload.role === 'HOTEL') {
      payload.hotelName = payload.hotelName || payload.name;
    } else if (payload.role === 'NGO') {
      payload.ngoName = payload.ngoName || payload.name;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const endpoint = payload.role === 'HOTEL' 
        ? `${baseUrl}/api/auth/register-hotel`
        : `${baseUrl}/api/auth/register-ngo`;

      const response = await axios.post(endpoint, payload);
      const userData = response.data;
      
      if (userData.status === 'PENDING') {
        setSuccessMessage(userData.message || 'NGO registration submitted. Access is pending Administrator approval.');
        setLoading(false);
        return;
      }
      
      setSuccessMessage('Registration successful! Logging you in...');
      login(userData);
      
      setTimeout(() => {
        navigate(`/${userData.role.toLowerCase()}/dashboard`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 sm:p-12">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full mb-2">
            <Heart size={28} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-slate-500 text-sm">Join the FeedLink AI movement to reduce surplus food waste</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-medium border border-rose-100 flex items-start gap-2.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-6 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 size={40} className="text-emerald-600" />
            <div>
              <p className="font-bold text-lg text-slate-900">Account Initialized</p>
              <p className="text-sm mt-1 text-slate-600">{successMessage}</p>
            </div>
            <button 
              onClick={() => navigate('/login')} 
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
            >
              Proceed to Login
            </button>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 text-center pb-4">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-3">Register as a...</label>
              <div className="flex justify-center gap-4">
                {['HOTEL', 'NGO'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({...formData, role: r})}
                    className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                      formData.role === r 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {r === 'HOTEL' ? 'Hotel and Hostals' : 'NGO Partner'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Contact Person Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="Manager Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="contact@feedlink.ai"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="+1 (555) 0199"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Street Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="123 Hope Lane, City Center"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            {formData.role === 'HOTEL' && (
              <div className="space-y-1.5 md:col-span-2 animate-in fade-in duration-300">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Hotel and Hostals Business Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                    placeholder="e.g. Grand Palace Hotel and Hostals"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({...formData, hotelName: e.target.value})}
                  />
                </div>
              </div>
            )}

            {formData.role === 'NGO' && (
              <>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">NGO Organization Name</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                        placeholder="e.g. Food Share Initiative"
                        value={formData.ngoName}
                        onChange={(e) => setFormData({...formData, ngoName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">NGO Registration Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                        placeholder="REG-2026-009"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Service Area Coverage</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                        placeholder="e.g. Downtown Metro, Southside"
                        value={formData.serviceArea}
                        onChange={(e) => setFormData({...formData, serviceArea: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start space-x-3">
                  <ShieldCheck className="text-emerald-600 mt-0.5 flex-shrink-0" size={20} />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    NGO registration requires system administrator verification. Your account status will be set as <span className="font-semibold text-slate-800">PENDING</span> until approved by the admin.
                  </p>
                </div>
              </>
            )}

            <button 
              disabled={loading} 
              type="submit" 
              className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/10"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Create Account</span>}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-all">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
