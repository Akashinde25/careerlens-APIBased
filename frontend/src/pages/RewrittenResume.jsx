import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Download, ArrowRight, Check, X, Sparkles, FileDown, ChevronDown } from 'lucide-react';

const BASE_URL = 'http://localhost:3001/api';

function HumanizeButton({ getText, onHumanized, disabled }) {
    const [isHumanizing, setIsHumanizing] = useState(false);

    const handleHumanize = async () => {
        const text = getText();
        if (!text) return;
        setIsHumanizing(true);
        try {
            const response = await fetch(`${BASE_URL}/humanize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let result = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                for (const line of chunk.split('\n')) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') break;
                        try {
                            const obj = JSON.parse(dataStr);
                            if (obj.chunk) result += obj.chunk;
                        } catch (_) {}
                    }
                }
            }
            if (result) onHumanized(result);
        } catch (e) {
            toast.error('Humanize failed.');
        } finally {
            setIsHumanizing(false);
        }
    };

    return (
        <button
            onClick={handleHumanize}
            disabled={disabled || isHumanizing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
            {isHumanizing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {isHumanizing ? 'Humanizing...' : '✨ Humanize'}
        </button>
    );
}

export default function RewrittenResume() {
    const navigate = useNavigate();
    const [bullets, setBullets] = useState([]);
    const [decisions, setDecisions] = useState({});
    const [isGenerating, setIsGenerating] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [humanizedBullets, setHumanizedBullets] = useState({});
    const profileRef = useRef(null);

    useEffect(() => {
        const candidateData = JSON.parse(localStorage.getItem('candidateData'));
        const jdData = JSON.parse(localStorage.getItem('jdData'));
        const gapData = JSON.parse(localStorage.getItem('gapData'));

        if (!candidateData || !jdData || !gapData) { navigate('/'); return; }
        profileRef.current = candidateData;

        const rewrite = async () => {
            try {
                const res = await API.post('/rewrite', {
                    candidate: candidateData,
                    jd: jdData,
                    gap_analysis: gapData
                });
                const data = res.data;
                const items = data.rewritten_experience || data.rewritten_bullets || data || [];
                const arr = Array.isArray(items) ? items : [];
                setBullets(arr);
                // Default all to accepted
                const init = {};
                arr.forEach((_, i) => { init[i] = 'accepted'; });
                setDecisions(init);
            } catch (err) {
                toast.error('Failed to generate rewritten resume.');
            } finally {
                setIsGenerating(false);
            }
        };
        rewrite();
    }, [navigate]);

    const acceptedCount = Object.values(decisions).filter(v => v === 'accepted').length;

    const handleDecision = (index, decision) => {
        setDecisions(prev => ({ ...prev, [index]: decision }));
    };

    const handleHumanizeBullet = (index, humanizedText) => {
        setHumanizedBullets(prev => ({ ...prev, [index]: humanizedText }));
        toast.success('Bullet humanized!');
    };

    const getAcceptedBullets = () => {
        return bullets
            .map((b, i) => ({
                original: b.original,
                rewritten: humanizedBullets[i] || b.rewritten || b.rewritten_bullet || b.original,
                index: i
            }))
            .filter((_, i) => decisions[i] === 'accepted');
    };

    const handleExport = async (format) => {
        const accepted = getAcceptedBullets();
        if (accepted.length === 0) {
            toast.error('No accepted bullets to export. Accept at least one change first.');
            return;
        }
        setIsExporting(true);
        try {
            const response = await fetch(`${BASE_URL}/resume/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: profileRef.current,
                    accepted_bullets: accepted,
                    format
                })
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimized_resume.${format}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Downloaded as .${format}!`);
        } catch (e) {
            toast.error('Export failed. Check backend logs.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">ATS-Optimized Resume</h2>
                    <p className="text-slate-500 mt-2 text-lg">Review each change. Accept or reject, then download your new resume.</p>
                    {!isGenerating && bullets.length > 0 && (
                        <p className="mt-1 text-sm text-slate-400">
                            <span className="text-emerald-600 font-bold">{acceptedCount}</span> of {bullets.length} changes accepted
                        </p>
                    )}
                </div>

                {!isGenerating && bullets.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            disabled={isExporting}
                            onClick={() => handleExport('docx')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 shadow-md text-sm"
                        >
                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                            Download DOCX
                        </button>
                        <button
                            disabled={isExporting}
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition disabled:opacity-50 shadow-md text-sm"
                        >
                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            Download PDF
                        </button>
                    </div>
                )}
            </div>

            {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-navy-900">Rewriting your experience...</h3>
                    <p className="text-slate-500 mt-2 text-sm text-center max-w-md">Groq AI is analyzing skill gaps and intelligently injecting JD requirements into your history without hallucinations.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {bullets.map((b, i) => {
                        const decision = decisions[i] || 'pending';
                        const humanized = humanizedBullets[i];
                        const rewrittenText = humanized || b.rewritten || b.rewritten_bullet || b.original;

                        return (
                            <div
                                key={i}
                                className={`bg-white p-5 rounded-2xl shadow-sm border-2 transition-all duration-300 ${
                                    decision === 'accepted'
                                        ? 'border-emerald-300 bg-emerald-50/20'
                                        : decision === 'rejected'
                                        ? 'border-red-200 opacity-60'
                                        : 'border-slate-200'
                                }`}
                            >
                                {/* Change explanation */}
                                {b.change_explanation && (
                                    <p className="text-[11px] text-slate-400 italic mb-3 border-b border-slate-100 pb-2">
                                        💡 {b.change_explanation}
                                    </p>
                                )}

                                <div className="flex flex-col lg:flex-row gap-4">
                                    {/* Original */}
                                    <div className="flex-1 bg-red-50/60 p-4 rounded-xl border border-red-100 relative">
                                        <span className="absolute top-0 right-0 bg-red-100 text-red-600 text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl tracking-wider">ORIGINAL</span>
                                        <p className="text-slate-600 text-sm leading-relaxed pt-3">{b.original}</p>
                                    </div>

                                    <div className="hidden lg:flex items-center justify-center text-slate-300">
                                        <ArrowRight size={22} />
                                    </div>

                                    {/* Rewritten */}
                                    <div className={`flex-1 p-4 rounded-xl border relative ${humanized ? 'bg-violet-50/50 border-violet-200' : 'bg-orange-50/60 border-orange-200'}`}>
                                        <span className={`absolute top-0 right-0 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl tracking-wider ${humanized ? 'bg-violet-500' : 'bg-orange-500'}`}>
                                            {humanized ? 'HUMANIZED' : 'OPTIMIZED'}
                                        </span>
                                        <p className="text-navy-900 font-medium text-sm leading-relaxed pt-3">{rewrittenText}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                    <HumanizeButton
                                        getText={() => rewrittenText}
                                        onHumanized={(text) => handleHumanizeBullet(i, text)}
                                        disabled={isGenerating || decision === 'rejected'}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDecision(i, 'rejected')}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${
                                                decision === 'rejected'
                                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'
                                            }`}
                                        >
                                            <X size={14} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleDecision(i, 'accepted')}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${
                                                decision === 'accepted'
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                                            }`}
                                        >
                                            <Check size={14} /> Accept
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {bullets.length === 0 && !isGenerating && (
                        <div className="p-10 text-center bg-slate-50 text-slate-500 rounded-3xl border border-slate-200">
                            <p className="font-semibold text-lg mb-2">No experience lines found</p>
                            <p className="text-sm">Make sure your resume file has an "Experience" or "Work History" section, and try uploading again.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
