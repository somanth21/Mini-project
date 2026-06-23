import { Link } from 'react-router-dom';
import { Leaf, Heart, Shield, ArrowRight, Github } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-white -z-10" />
        <div className="absolute top-0 right-0 h-96 w-96 bg-brand-primary/10 rounded-full blur-3xl -mr-48 -mt-24" />
        
        <div className="text-center space-y-8 max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            <Leaf size={16} />
            <span>AI-Powered Food Sustainability</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
            Stop Food Waste, <span className="text-brand-primary">Feed Families</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            FeedLink AI connects restaurants, donors, and NGOs using advanced computer vision 
            to analyze food quality and distribution real-time.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/register" className="btn btn-primary text-lg px-8 py-3 flex items-center space-x-2">
              <span>Start Donating</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-lg px-8 py-3">
              NGO Login
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-6xl mx-auto w-full">
        <div className="card p-8 space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mx-auto">
            <Heart />
          </div>
          <h3 className="text-3xl font-bold text-slate-900">50,000+</h3>
          <p className="text-slate-500">Meals Distributed</p>
        </div>
        <div className="card p-8 space-y-4 text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Shield />
          </div>
          <h3 className="text-3xl font-bold text-slate-900">1,200+</h3>
          <p className="text-slate-500">Verified NGOs</p>
        </div>
        <div className="card p-8 space-y-4 text-center">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mx-auto">
            <Leaf />
          </div>
          <h3 className="text-3xl font-bold text-slate-900">15 Tons</h3>
          <p className="text-slate-500">CO2 Emissions Saved</p>
        </div>
      </section>

      {/* Features Heading */}
      <section className="space-y-16 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-slate-900">How FeedLink AI Works</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Our platform uses cutting-edge technology to ensure food safety and efficient redistribution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">AI Food Recognition</h3>
              <p className="text-slate-600">Simply upload a photo. Our AI identifies the food type, estimates servings, and calculates a freshness score automatically.</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-slate-700">
                <div className="w-2 h-2 bg-brand-primary rounded-full" />
                <span>98% Accuracy in Category Detection</span>
              </li>
              <li className="flex items-center space-x-3 text-slate-700">
                <div className="w-2 h-2 bg-brand-primary rounded-full" />
                <span>Real-time Serving Estimation</span>
              </li>
              <li className="flex items-center space-x-3 text-slate-700">
                <div className="w-2 h-2 bg-brand-primary rounded-full" />
                <span>Smart Freshness Recommendation</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-200 aspect-video rounded-2xl shadow-inner flex items-center justify-center italic text-slate-400 overflow-hidden relative">
             <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=1000")'}} />
             <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-[2px]" />
             <span className="relative z-10 text-white font-medium drop-shadow-md">AI Vision Dashboard</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 pt-16 pb-8 px-4 flex flex-col items-center">
        <div className="flex space-x-6 mb-8 text-slate-400">
          <Github className="hover:text-slate-900 cursor-pointer transition-colors" />
        </div>
        <p className="text-slate-500 text-sm">© 2026 FeedLink AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
