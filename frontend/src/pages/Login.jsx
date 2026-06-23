import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Loader2, KeyRound, ArrowLeft, Eye, EyeOff, Heart, ShieldAlert, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remember me email
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', { email, password });
      const userData = response.data;
      
      if (userData.status === 'PENDING') {
        setError(userData.message || 'Your account is pending Admin approval.');
        setLoading(false);
        return;
      }
      
      if (userData.status === 'SUSPENDED') {
        setError(userData.message || 'Your account has been suspended by the administrator.');
        setLoading(false);
        return;
      }
      
      if (!userData.token) {
        setError(userData.message || 'Authentication failed.');
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }
      
      setSuccess('Login successful! Redirecting...');
      login(userData);

      setTimeout(() => {
        navigate(`/${userData.role.toLowerCase()}/dashboard`);
      }, 1000);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/forgot-password', { email });
      setSuccess(response.data.message || 'Password reset link sent to ' + email);
      setLoading(false);
      setTimeout(() => setView('reset'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset request');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/reset-password', { email, password: newPassword });
      setSuccess(response.data.message || 'Password reset successfully.');
      setLoading(false);
      setTimeout(() => {
        setView('login');
        setSuccess('');
        setPassword('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Illustration / Brand Themed */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-600 to-teal-800 text-white relative overflow-hidden">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
              <Heart size={14} className="text-pink-300 animate-pulse" />
              <span>Feeding Communities</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Bridging the Gap Between Surplus & Hunger.
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed max-w-md">
              FeedLink AI optimizes surplus food logistics, matching hotels and restaurants with local NGOs to minimize waste and feed those in need in real-time.
            </p>
          </div>

          <div className="space-y-6 pt-12 border-t border-white/10 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">25K+</p>
                <p className="text-xs text-emerald-200">Meals Rescued</p>
              </div>
              <div>
                <p className="text-3xl font-bold">150+</p>
                <p className="text-xs text-emerald-200">Partner NGOs</p>
              </div>
            </div>
            <blockquote className="text-xs italic text-emerald-100/80">
              "We have cut our restaurant's food waste by 65% while supporting three local shelter houses." 
              <span className="block mt-1 font-semibold not-italic text-white">— Grand Palace Hotel Manager</span>
            </blockquote>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          {view === 'login' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                <p className="text-slate-500 text-sm">Please sign in to access your portal</p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-medium border border-rose-100 flex items-start gap-2.5">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-medium border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                      placeholder="name@feedlink.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} 
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center cursor-pointer select-none">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="ml-2 text-xs font-medium text-slate-600">
                      Remember me on this device
                    </span>
                  </label>
                </div>

                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Sign In</span>}
                </button>
              </form>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); setSuccess(''); }} 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight pt-2">Forgot Password</h2>
                <p className="text-slate-500 text-sm">Enter your email and we'll send you reset instructions.</p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-medium border border-rose-100 flex items-start gap-2.5">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-medium border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                      placeholder="name@feedlink.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/10"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Send Reset Instructions</span>}
                </button>
              </form>
            </div>
          )}

          {view === 'reset' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Password</h2>
                <p className="text-slate-500 text-sm">Enter the new password for <strong>{email}</strong></p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-medium border border-rose-100 flex items-start gap-2.5">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-medium border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/10"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Update Password</span>}
                </button>
              </form>
            </div>
          )}

          {/* Footer link to Register */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-all">
                Register here
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
