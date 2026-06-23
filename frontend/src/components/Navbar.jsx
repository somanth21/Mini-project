import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, LayoutDashboard, Utensils } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return `/${user.role.toLowerCase()}`;
  };

  return (
    <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Utensils size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">FeedLink<span className="text-brand-primary">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-slate-600 hover:text-brand-primary font-medium transition-colors">Home</Link>
          <a href="#impact" className="text-slate-600 hover:text-brand-primary font-medium transition-colors">Impact</a>
          <a href="#how-it-works" className="text-slate-600 hover:text-brand-primary font-medium transition-colors">Safety</a>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to={getDashboardLink()} className="btn btn-primary flex items-center space-x-2">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-danger transition-colors">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 font-medium hover:text-brand-primary transition-colors">Login</Link>
              <Link to="/register" className="btn btn-primary">Join Now</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
