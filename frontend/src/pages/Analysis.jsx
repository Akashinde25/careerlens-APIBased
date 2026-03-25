import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Info, ChevronRight, PenTool } from 'lucide-react';

function ATSMeter({ score }) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    let color = "text-red-500";
    if (score >= 70) color = "text-yellow-500";
    if (score >= 85) color = "text-orange-500";

    return (
        <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-navy-900">{score}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">ATS Match</span>
            </div>
        </div>
    );
}

export default function Analysis() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('gapData');
        if (!raw) { navigate('/'); return; }
        setData(JSON.parse(raw));
    }, [navigate]);

    if (!data) return null;

    const ats = data.ats_score || {};
    const score = ats.score || ats.total || 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex-1 pr-8">
                    <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight mb-4">Fit Analysis Report</h2>
                    <p className="text-slate-600 leading-relaxed text-lg bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        {data.summary_paragraph}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4">
                        <div className="px-5 py-3 rounded-xl bg-blue-50/50 border border-blue-100 flex-1 min-w-[150px]">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Hiring Probability</p>
                            <p className="text-lg font-bold text-blue-700">{data.hiring_probability_estimate}</p>
                        </div>
                        <div className="px-5 py-3 rounded-xl bg-purple-50/50 border border-purple-100 flex-1 min-w-[150px]">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Overall Core Fit</p>
                            <p className="text-lg font-bold text-purple-700">{data.overall_fit_percentage}%</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-3xl border border-slate-100 min-w-[280px]">
                    <ATSMeter score={score} />
                    {ats.tips && ats.tips.length > 0 && (
                        <div className="mt-6 w-full text-xs text-slate-500">
                            <p className="font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">Critical ATS Tips:</p>
                            <ul className="space-y-2">
                                {ats.tips.slice(0, 3).map((tip, i) => (
                                    <li key={i} className="flex gap-2 items-start bg-white p-2.5 rounded-lg border border-slate-200 leading-tight">
                                        <Info size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-navy-900 mb-6">Skill Gap Breakdown</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="bg-emerald-50/30 rounded-3xl p-6 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <CheckCircle size={18} />
                            </div>
                            <h4 className="font-bold text-emerald-800 text-lg">Strong Matches</h4>
                            <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">{data.green?.length || 0}</span>
                        </div>
                        <div className="space-y-3">
                            {(data.green || []).map((item, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                                    <p className="font-bold text-slate-800 mb-1">{item.skill}</p>
                                    <p className="text-xs text-slate-500 leading-snug">{item.evidence_from_resume}</p>
                                </div>
                            ))}
                            {(!data.green || data.green.length === 0) && (
                                <p className="text-sm text-slate-400 text-center py-4">No strong semantic matches found.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-yellow-50/30 rounded-3xl p-6 border border-yellow-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                <AlertTriangle size={18} />
                            </div>
                            <h4 className="font-bold text-yellow-800 text-lg">Partial Matches</h4>
                            <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">{data.yellow?.length || 0}</span>
                        </div>
                        <div className="space-y-3">
                            {(data.yellow || []).map((item, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl border border-yellow-100/50 shadow-sm relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                                    <p className="font-bold text-slate-800 mb-1 pl-2">{item.skill}</p>
                                    <p className="text-xs text-slate-600 mb-2 pl-2 bg-yellow-50 p-2 rounded border border-yellow-100">{item.gap_description}</p>
                                    <p className="text-[10px] text-slate-400 pl-2 italic">"{item.adjacent_evidence}"</p>
                                </div>
                            ))}
                            {(!data.yellow || data.yellow.length === 0) && (
                                <p className="text-sm text-slate-400 text-center py-4">No partial matches found.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-red-50/30 rounded-3xl p-6 border border-red-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <AlertTriangle size={18} />
                            </div>
                            <h4 className="font-bold text-red-800 text-lg">Critical Gaps</h4>
                            <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{data.red?.length || 0}</span>
                        </div>
                        <div className="space-y-3">
                            {(data.red || []).map((item, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl border border-red-100/50 shadow-sm relative">
                                    {item.importance === 'high' && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">HIGH IMP</span>
                                    )}
                                    <p className="font-bold text-slate-800 mb-1">{item.skill}</p>
                                    <p className="text-xs text-slate-500 leading-snug">{item.why_it_matters}</p>
                                </div>
                            ))}
                            {(!data.red || data.red.length === 0) && (
                                <p className="text-sm text-slate-400 text-center py-4">No critical gaps! Great fit.</p>
                            )}
                        </div>

                        {data.red?.length > 0 && (
                            <button
                                onClick={() => navigate('/roadmap')}
                                className="w-full mt-6 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm"
                            >
                                Generate Custom Skilling Plan
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-8 border-t border-slate-200">
                <button
                    onClick={() => navigate('/rewrite')}
                    className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                    <PenTool size={20} />
                    Optimize Resume Bullets
                    <ChevronRight size={20} className="ml-2" />
                </button>
            </div>

        </div>
    );
}
