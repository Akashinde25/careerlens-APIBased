import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, Loader2, Copy, Check, Zap, Sparkles, MessageSquareQuote } from 'lucide-react';

const BASE_URL = 'http://localhost:3001/api';

async function streamFromAPI(endpoint, body, onChunk, onDone, onError) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6);
                    if (dataStr === '[DONE]') { onDone(); return; }
                    try {
                        const obj = JSON.parse(dataStr);
                        if (obj.chunk) onChunk(obj.chunk);
                    } catch (_) {}
                }
            }
        }
        onDone();
    } catch (e) {
        onError(e);
    }
}

export default function CompanyInterest() {
    const navigate = useNavigate();
    const [answer, setAnswer] = useState('');
    const [companyNotes, setCompanyNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [roleName, setRoleName] = useState('');

    useEffect(() => {
        const jdData = JSON.parse(localStorage.getItem('jdData'));
        const candidateData = JSON.parse(localStorage.getItem('candidateData'));
        if (!candidateData || !jdData) { navigate('/'); return; }
        setCompanyName(jdData.company || '');
        setRoleName(jdData.title || '');
    }, [navigate]);

    const generateAnswer = async () => {
        const candidateData = JSON.parse(localStorage.getItem('candidateData'));
        const jdData = JSON.parse(localStorage.getItem('jdData'));

        setAnswer('');
        setIsGenerating(true);
        await streamFromAPI(
            '/company-interest',
            { candidate: candidateData, jd: { ...jdData, company: companyName, title: roleName }, company_notes: companyNotes },
            (chunk) => setAnswer(prev => prev + chunk),
            () => setIsGenerating(false),
            () => { toast.error('Generation failed.'); setIsGenerating(false); }
        );
    };

    const humanizeAnswer = async () => {
        if (!answer) return;
        const original = answer;
        setIsHumanizing(true);
        setAnswer('');
        await streamFromAPI(
            '/humanize',
            { text: original },
            (chunk) => setAnswer(prev => prev + chunk),
            () => { setIsHumanizing(false); toast.success('Answer humanized!'); },
            () => { toast.error('Humanize failed.'); setIsHumanizing(false); setAnswer(original); }
        );
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(answer);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Company Interest</h2>
                    <p className="text-slate-500 mt-2 text-lg">Get a tailored answer to "What interests you about working here?"</p>
                </div>

                {answer && !isGenerating && (
                    <button
                        onClick={humanizeAnswer}
                        disabled={isHumanizing}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md"
                    >
                        {isHumanizing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        {isHumanizing ? 'Humanizing...' : '✨ Humanize'}
                    </button>
                )}
            </div>

            {/* Input Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="e.g. Google, Stripe, Notion..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50"
                            disabled={isGenerating || isHumanizing}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role Title</label>
                        <input
                            type="text"
                            value={roleName}
                            onChange={e => setRoleName(e.target.value)}
                            placeholder="e.g. Software Engineer, Product Manager..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50"
                            disabled={isGenerating || isHumanizing}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        What do you know about this company? <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                        value={companyNotes}
                        onChange={e => setCompanyNotes(e.target.value)}
                        placeholder="e.g. They recently launched X... Their mission is Y... I read about their work in Z..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 resize-none"
                        disabled={isGenerating || isHumanizing}
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={generateAnswer}
                        disabled={isGenerating || isHumanizing || !companyName}
                        className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        {isGenerating ? 'Generating...' : 'Generate Answer'}
                    </button>
                </div>
            </div>

            {/* Output Panel */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[350px] flex flex-col">
                {answer ? (
                    <>
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 transition-colors"
                            >
                                {copied ? <Check size={16} className="text-orange-500" /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-10 whitespace-pre-wrap text-slate-700 leading-relaxed text-base flex-1">
                            {answer}
                            {(isGenerating || isHumanizing) && <span className="inline-block w-2.5 h-5 ml-1 bg-orange-500 animate-pulse align-middle"></span>}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-200 rounded-full flex items-center justify-center mb-4">
                            <MessageSquareQuote size={32} />
                        </div>
                        <p className="text-slate-500 font-medium max-w-sm">Fill in the company details above and click Generate to get a genuine, tailored answer.</p>
                        <p className="text-slate-400 text-sm mt-2 max-w-sm">After generating, click ✨ Humanize to make it sound more natural and less AI-generated.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
