import { useState } from 'react';
import { Truck, MapPin, CheckCircle, Navigation, Phone, Clock } from 'lucide-react';

const VolunteerDashboard = () => {
  const [activeTask, setActiveTask] = useState({
    id: 'TK-9921',
    from: 'The Italian Bistro',
    to: 'Unity Kitchen',
    items: '2 Large Trays of Lasagna',
    status: 'EN_ROUTE',
    dist: '1.4km away'
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Assignments</h1>
        <p className="text-slate-500">Real-time pickup and delivery coordination.</p>
      </header>

      {activeTask ? (
        <div className="card border-none shadow-2xl shadow-emerald-100 overflow-visible relative">
           <div className="absolute -top-3 left-8 px-4 py-1 bg-brand-primary text-white text-xs font-bold rounded-full animate-bounce">
             LIVE ASSIGNMENT
           </div>
           
           <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary">
                          <Truck size={28} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeTask.id}</p>
                          <h2 className="text-2xl font-bold text-slate-900">{activeTask.items}</h2>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button className="btn bg-blue-50 text-blue-600 border-none px-6 flex items-center gap-2">
                       <Phone size={18} />
                       <span className="font-bold">Call NGO</span>
                    </button>
                 </div>
              </div>

              <div className="relative space-y-0">
                 <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100 border-l border-dashed border-slate-300" />
                 
                 <div className="relative pl-10 pb-10">
                    <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-brand-primary rounded-full flex items-center justify-center">
                       <div className="w-2 h-2 bg-brand-primary rounded-full" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Pickup Location</p>
                    <p className="text-lg font-bold text-slate-800">{activeTask.from}</p>
                    <p className="text-sm text-slate-500">123 Market St, Downtown</p>
                 </div>

                 <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center">
                       <div className="w-2 h-2 bg-slate-300 rounded-full" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Drop-off Location</p>
                    <p className="text-lg font-bold text-slate-800">{activeTask.to}</p>
                    <p className="text-sm text-slate-500">Community Center, North Wing</p>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                 <button className="btn btn-primary flex-grow py-4 text-lg flex items-center justify-center gap-2">
                    <Navigation size={20} />
                    <span>Open Navigation</span>
                 </button>
                 <button className="btn bg-white border border-slate-200 text-slate-700 py-4 px-8 flex items-center justify-center gap-2 hover:bg-slate-50">
                    <CheckCircle size={20} />
                    <span>Confirm Drop-off</span>
                 </button>
              </div>
           </div>
        </div>
      ) : (
        <div className="card p-20 text-center border-dashed border-2 flex flex-col items-center gap-4 bg-slate-50/50">
           <div className="w-20 h-20 text-slate-300">
             <Clock size={80} />
           </div>
           <h3 className="text-xl font-bold text-slate-400">No active tasks right now</h3>
           <p className="text-slate-400 max-w-xs mx-auto text-sm">We'll notify you as soon as a donation matches your route.</p>
        </div>
      )}

      {/* Stats Table */}
      <div className="card p-8 bg-slate-900 text-white border-none">
         <h3 className="text-lg font-bold mb-6">Your Contribution</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Pickups</p>
               <p className="text-3xl font-extrabold">12</p>
            </div>
            <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Distance</p>
               <p className="text-3xl font-extrabold">45 <span className="text-sm font-normal">km</span></p>
            </div>
            <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">People Fed</p>
               <p className="text-3xl font-extrabold">~240</p>
            </div>
            <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Impact pts</p>
               <p className="text-3xl font-extrabold text-brand-primary">1.2k</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
