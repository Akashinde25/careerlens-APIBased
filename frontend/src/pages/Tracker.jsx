import { useState, useEffect } from 'react';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Briefcase, Target } from 'lucide-react';

const COLUMNS = ['Wishlist', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

export default function Tracker() {
    const [apps, setApps] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newApp, setNewApp] = useState({ company: '', role: '', url: '', status: 'Wishlist', atsScore: 0 });

    useEffect(() => {
        API.get('/tracker').then(res => setApps(res.data)).catch(err => console.error(err));
    }, []);

    const moveCard = async (id, status) => {
        try {
            const res = await API.put(`/tracker/${id}`, { status });
            setApps(apps.map(a => a.id === id ? res.data : a));
            toast.success("Moved successfully!");
        } catch {
            toast.error("Failed to update status.");
        }
    };

    const handleCreate = async () => {
        if (!newApp.company || !newApp.role) return toast.error("Company and Role required");
        try {
            const res = await API.post('/tracker', newApp);
            setApps([...apps, res.data]);
            setIsModalOpen(false);
            setNewApp({ company: '', role: '', url: '', status: 'Wishlist', atsScore: 0 });
            toast.success("Added to tracker!");
        } catch {
            toast.error("Failed to add.");
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-[85vh] flex flex-col pb-4">
            <Toaster position="top-right" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Application Tracker</h2>
                    <p className="text-slate-500 mt-1 text-lg">Manage your active pipeline.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} /> Add Role
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-6 snap-x pt-2 px-1 scrollbar-hide">
                {COLUMNS.map(col => (
                    <div key={col} className="min-w-[320px] w-[320px] bg-slate-100/50 rounded-3xl p-5 flex flex-col border border-slate-200 shrink-0 snap-start shadow-sm">
                        <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-5 flex items-center justify-between px-1">
                            {col}
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{apps.filter(a => a.status === col).length}</span>
                        </h3>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                            {apps.filter(a => a.status === col).map(app => (
                                <div key={app.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-default hover:shadow-md transition-shadow group relative">
                                    <h4 className="font-bold text-navy-900 leading-tight text-lg">{app.role}</h4>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <Briefcase size={14} className="text-blue-500" /> {app.company}
                                    </div>

                                    <div className="mt-5 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-200">
                                            <Target size={14} /> {app.atsScore || '--'} Score
                                        </div>

                                        <select
                                            className="text-xs font-semibold border-slate-200 rounded-lg bg-white py-1.5 pl-3 pr-8 text-slate-600 focus:ring-orange-500 focus:border-orange-500 shadow-sm outline-none cursor-pointer"
                                            value={app.status}
                                            onChange={(e) => moveCard(app.id, e.target.value)}
                                        >
                                            {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}

                            {apps.filter(a => a.status === col).length === 0 && (
                                <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm font-medium">
                                    Drop here
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-extrabold text-navy-900 mb-6 tracking-tight">Add Application</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-1.5">Company</label>
                                <input autoFocus type="text" placeholder="e.g. Google" className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={newApp.company} onChange={e => setNewApp({ ...newApp, company: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-1.5">Role Title</label>
                                <input type="text" placeholder="e.g. Senior Backend Engineer" className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={newApp.role} onChange={e => setNewApp({ ...newApp, role: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1.5">ATS Match</label>
                                    <input type="number" placeholder="85" className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={newApp.atsScore} onChange={e => setNewApp({ ...newApp, atsScore: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Initial Status</label>
                                    <select className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={newApp.status} onChange={e => setNewApp({ ...newApp, status: e.target.value })}>
                                        {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-6 flex gap-3">
                                <button className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button className="flex-1 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-700 transition-all shadow-md" onClick={handleCreate}>Save to Board</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
