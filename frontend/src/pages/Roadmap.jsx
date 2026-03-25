import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { Circle, Loader2, MapPin, ExternalLink } from 'lucide-react';

export default function Roadmap() {
    const navigate = useNavigate();
    const [redGaps, setRedGaps] = useState([]);
    const [roadmaps, setRoadmaps] = useState({});
    const [loadingMap, setLoadingMap] = useState({});

    useEffect(() => {
        const gapData = JSON.parse(localStorage.getItem('gapData'));
        const jdData = JSON.parse(localStorage.getItem('jdData'));

        if (!gapData || !jdData) { navigate('/'); return; }

        const gaps = gapData.red || [];
        setRedGaps(gaps);

        const fetchAll = async () => {
            for (const gap of gaps) {
                setLoadingMap(prev => ({ ...prev, [gap.skill]: true }));
                try {
                    const res = await API.post('/roadmap', {
                        skill: gap.skill,
                        jd_context: `Role: ${jdData.title} at ${jdData.company}. Context: ${gap.why_it_matters}`,
                        candidate_level: "none"
                    });
                    setRoadmaps(prev => ({ ...prev, [gap.skill]: res.data }));
                } catch (e) {
                    toast.error(`Failed to generate roadmap for ${gap.skill}`);
                } finally {
                    setLoadingMap(prev => ({ ...prev, [gap.skill]: false }));
                }
            }
        };

        if (gaps.length > 0) fetchAll();
    }, [navigate]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Toaster position="top-right" />

            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Personalized Skilling Plan</h2>
                <p className="text-slate-500 mt-2 text-lg">Actionable weekly sprints to close your critical skill gaps, powered by Groq.</p>
            </div>

            {redGaps.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl text-center border border-slate-200">
                    <p className="text-slate-500">You have no critical red gaps to address!</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {redGaps.map((gap, idx) => {
                        const plan = roadmaps[gap.skill];
                        const isLoading = loadingMap[gap.skill];

                        return (
                            <div key={idx} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-navy-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <MapPin className="text-orange-400" />
                                            {gap.skill}
                                        </h3>
                                        <p className="text-slate-400 text-sm mt-1">{gap.why_it_matters}</p>
                                    </div>
                                    {plan && (
                                        <div className="bg-navy-800 px-4 py-2 rounded-xl text-orange-400 font-bold text-sm border border-navy-700">
                                            {plan.days_to_achieve} Days Sprint ({plan.daily_hours_assumed} hrs/day)
                                        </div>
                                    )}
                                </div>

                                <div className="p-8">
                                    {isLoading || !plan ? (
                                        <div className="flex items-center justify-center p-10 text-slate-500 gap-3">
                                            <Loader2 className="animate-spin w-6 h-6 text-orange-500" /> Generating curriculum via Groq...
                                        </div>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[1, 2, 3].map(weekNum => {
                                                    const tasks = plan[`week_${weekNum}`] || [];
                                                    return (
                                                        <div key={weekNum} className="relative bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                                            <h4 className="font-bold text-navy-800 bg-white rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-wider mb-4 inline-block shadow-sm border border-slate-200">
                                                                Week {weekNum}
                                                            </h4>
                                                            <ul className="space-y-3">
                                                                {tasks.map((task, tIdx) => (
                                                                    <li key={tIdx} className="flex gap-3 items-start group">
                                                                        <div className="mt-0.5 text-slate-300 group-hover:text-orange-500 transition-colors">
                                                                            <Circle size={14} />
                                                                        </div>
                                                                        <span className="text-sm text-slate-700 leading-tight">{task}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                                    <h4 className="font-bold text-blue-900 mb-3 text-sm tracking-wide">RECOMMENDED FREE RESOURCES</h4>
                                                    <ul className="space-y-2">
                                                        {(plan.free_resources || []).map((res, rIdx) => (
                                                            <li key={rIdx} className="flex items-center gap-2 text-sm text-blue-800 font-medium bg-white px-3 py-2 rounded-lg border border-blue-100/50">
                                                                <ExternalLink size={14} className="opacity-50" /> {res}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 flex flex-col justify-center">
                                                    <h4 className="font-bold text-orange-900 mb-2 text-sm tracking-wide">CAPSTONE PROJECT IDEA</h4>
                                                    <p className="text-sm text-orange-800 font-medium leading-relaxed bg-white p-4 rounded-xl border border-orange-100/50">"{plan.project_idea}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
