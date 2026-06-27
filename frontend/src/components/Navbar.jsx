import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, LayoutDashboard, Utensils, Bell, Check } from 'lucide-react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await axios.get((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Setup STOMP WebSocket client
    const socket = new SockJS((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        // Broadcast channel
        stompClient.subscribe('/topic/notifications', (msg) => {
          const notification = JSON.parse(msg.body);
          if (notification.userId === 0 || notification.userId === user.id) {
            handleIncomingNotification(notification);
          }
        });
        // Direct channel
        stompClient.subscribe(`/topic/user/${user.id}/notifications`, (msg) => {
          const notification = JSON.parse(msg.body);
          handleIncomingNotification(notification);
        });
      },
      debug: (str) => {
        console.log(str);
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user]);

  const handleIncomingNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + `/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return `/${user.role.toLowerCase()}`;
  };

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'HOTEL') return 'Hotel and Hostals Dashboard';
    return `${user.role} Dashboard`;
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
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 text-slate-600 hover:text-brand-primary rounded-xl hover:bg-slate-50 transition-colors relative cursor-pointer"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">Notifications</span>
                      <span className="text-[10px] text-slate-500 font-medium">{unreadCount} unread</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-slate-50 flex justify-between items-start hover:bg-slate-50 transition-colors ${
                              !n.read ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            <div className="flex-1 mr-2">
                              <h4 className={`text-xs font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 leading-normal">{n.message}</p>
                            </div>
                            {!n.read && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="p-1 text-slate-400 hover:text-brand-primary bg-slate-100 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                              >
                                <Check size={10} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to={getDashboardLink()} className="btn btn-primary flex items-center space-x-2 text-xs">
                <LayoutDashboard size={16} />
                <span>{getDashboardLabel()}</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-danger transition-colors cursor-pointer">
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
