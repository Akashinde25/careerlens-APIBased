import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Download, ArrowRight } from 'lucide-react';

export default function RewrittenResume() {
    const navigate = useNavigate();
    const [bullets, setBullets] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);

    useEffect(() => {
        const candidateData = JSON.parse(localStorage.getItem('candidateData'));
        const jdData = JSON.parse(localStorage.getItem('jdData'));
        const gapData = JSON.parse(localStorage.getItem('gapData'));

        if (!candidateData || !jdData || !gapData) { navigate('/'); return; }

        const rewrite = async () => {
            try {
                const res = await API.post('/rewrite', {
                    candidate: candidateData,
                    jd: jdData,
                    gap_analysis: gapData
                });
                // Handle both response shapes
                const data = res.data;
                const items = data.rewritten_experience || data.rewritten_bullets || data || [];
                setBullets(Array.isArray(items) ? items : []);
            } catch (err) {
                toast.error("Failed to generate rewritten resume.");
            } finally {
                setIsGenerating(false);
            }
        };

        rewrite();
    }, [navigate]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Toaster position="top-right" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">ATS-Optimized Resume</h2>
                    <p className="text-slate-500 mt-2 text-lg">Your experience bullets, re-engineered for exact ATS keyword match via Groq.</p>
                </div>
                <button
                    disabled={isGenerating || bullets.length === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    onClick={() => toast.error("PDF Download coming soon.")}
                >
                    <Download size={18} /> Download New PDF
                </button>
            </div>

            {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-navy-900">Rewriting your experience...</h3>
                    <p className="text-slate-500 mt-2 text-sm text-center max-w-md">Groq AI is analyzing skill gaps and intelligently injecting JD requirements into your history without hallucinations.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {bullets.map((b, i) => (
                        <div key={i} className="flex flex-col lg:flex-row gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex-1 bg-red-50/40 p-5 rounded-xl border border-red-100 relative">
                                <span className="absolute top-0 right-0 bg-red-100 text-red-600 text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl tracking-wider">ORIGINAL</span>
                                <p className="text-slate-700 text-sm leading-relaxed pt-2">{b.original}</p>
                            </div>
                            <div className="hidden lg:flex items-center justify-center text-slate-300">
                                <ArrowRight size={24} />
                            </div>
                            <div className="flex-1 bg-orange-50/60 p-5 rounded-xl border border-orange-200 relative shadow-sm">
                                <span className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl tracking-wider">OPTIMIZED</span>
                                <p className="text-navy-900 font-medium text-sm leading-relaxed pt-2">{b.rewritten || b.rewritten_bullet}</p>
                            </div>
                        </div>
                    ))}
                    {bullets.length === 0 && !isGenerating && (
                        <div className="p-10 text-center bg-slate-50 text-slate-500 rounded-3xl border border-slate-200">
                            No bullets to rewrite. Make sure your resume has bullet-point experience sections.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
