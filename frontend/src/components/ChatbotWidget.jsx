import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Hello! I am your FeedLink AI Assistant. I can help you check donation status, review histories, recommend local partners, or explain analytics. How can I help you today?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!user) return null; // Only show for logged in users

  const getQuickActions = () => {
    switch (user.role) {
      case 'HOTEL':
        return [
          'Show my active donations',
          'How many meals have I donated?',
          'How do I donate food?'
        ];
      case 'NGO':
        return [
          'Show nearby donations',
          'Show pending pickups',
          'Explain recommendation scores'
        ];
      case 'ADMIN':
        return [
          'Show platform statistics',
          'NGO approval summary',
          'Explain AI analytics'
        ];
      default:
        return [];
    }
  };

  const handleSend = async (text) => {
    const messageToSend = text || inputValue;
    if (!messageToSend.trim()) return;

    if (!text) setInputValue('');

    const newMessages = [...messages, { role: 'user', content: messageToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      // Format history payload
      const historyPayload = messages.slice(1).map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        content: m.content
      }));

      const res = await axios.post((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/api/chatbot/message', {
        message: messageToSend,
        conversationId,
        history: historyPayload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages([...newMessages, { role: 'bot', content: res.data.response }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages([...newMessages, { role: 'bot', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="bg-brand-primary p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">FeedLink AI Assistant</h3>
                <span className="text-[10px] text-emerald-100 flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full mr-1 animate-pulse"></span>
                  Active Context
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${
                    m.role === 'user' ? 'bg-indigo-500' : 'bg-brand-primary shadow-md'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                    m.role === 'user' 
                      ? 'bg-indigo-500 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center text-white">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 rounded-tl-none shadow-sm flex space-x-1 items-center h-8">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="p-2 border-t border-slate-100 bg-white flex flex-wrap gap-1">
            {getQuickActions().map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action)}
                className="text-[10px] text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-brand-primary px-2 py-1 rounded-full transition-colors border border-slate-100"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-primary bg-slate-50"
            />
            <button type="submit" className="p-2 bg-brand-primary hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all">
              <Send size={14} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-brand-primary hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer group"
        >
          <MessageSquare className="group-hover:rotate-12 transition-transform" size={24} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;
