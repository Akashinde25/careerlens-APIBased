import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FileText, Loader2, Copy, Check, Zap, Sparkles } from 'lucide-react';

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

export default function CoverLetter() {
    const navigate = useNavigate();
    const [letter, setLetter] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [tone, setTone] = useState('professional');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const candidateData = JSON.parse(localStorage.getItem('candidateData'));
        const jdData = JSON.parse(localStorage.getItem('jdData'));
        if (!candidateData || !jdData) { navigate('/'); }
    }, [navigate]);

    const generateLetter = async () => {
        const candidateData = JSON.parse(localStorage.getItem('candidateData'));
        const jdData = JSON.parse(localStorage.getItem('jdData'));
        setLetter('');
        setIsGenerating(true);
        await streamFromAPI(
            '/cover-letter',
            { candidate: candidateData, jd: jdData, tone },
            (chunk) => setLetter(prev => prev + chunk),
            () => setIsGenerating(false),
            () => { toast.error('Generation failed.'); setIsGenerating(false); }
        );
    };

    const humanizeLetter = async () => {
        if (!letter) return;
        setIsHumanizing(true);
        let result = '';
        await streamFromAPI(
            '/humanize',
            { text: letter },
            (chunk) => { result += chunk; setLetter(prev => prev + chunk); },
            () => { setIsHumanizing(false); toast.success('Letter humanized!'); },
            () => { toast.error('Humanize failed.'); setIsHumanizing(false); }
        );
        // Replace the whole letter with the humanized version when done
        setLetter(result);
        setIsHumanizing(false);
    };

    const humanizeStreamed = async () => {
        if (!letter) return;
        const originalLetter = letter;
        setIsHumanizing(true);
        setLetter('');
        await streamFromAPI(
            '/humanize',
            { text: originalLetter },
            (chunk) => setLetter(prev => prev + chunk),
            () => { setIsHumanizing(false); toast.success('Letter humanized!'); },
            () => { toast.error('Humanize failed.'); setIsHumanizing(false); setLetter(originalLetter); }
        );
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(letter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">AI Cover Letter</h2>
                    <p className="text-slate-500 mt-2 text-lg">Hyper-tailored, streamed live from Groq.</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {letter && !isGenerating && (
                        <button
                            onClick={humanizeStreamed}
                            disabled={isHumanizing}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md"
                        >
                            {isHumanizing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                            {isHumanizing ? 'Humanizing...' : '✨ Humanize'}
                        </button>
                    )}
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <select
                            value={tone}
                            onChange={e => setTone(e.target.value)}
                            disabled={isGenerating || isHumanizing}
                            className="border-none bg-slate-50 rounded-lg text-sm font-medium focus:ring-0 cursor-pointer"
                        >
                            <option value="professional">Professional</option>
                            <option value="enthusiastic">Enthusiastic</option>
                            <option value="direct">Direct & Concise</option>
                        </select>
                        <button
                            onClick={generateLetter}
                            disabled={isGenerating || isHumanizing}
                            className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:from-orange-600 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                            Generate
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px] flex flex-col">
                {letter ? (
                    <>
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 transition-colors"
                            >
                                {copied ? <Check size={16} className="text-orange-500" /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-10 whitespace-pre-wrap text-slate-700 leading-relaxed font-serif text-lg flex-1">
                            {letter}
                            {(isGenerating || isHumanizing) && <span className="inline-block w-2.5 h-5 ml-1 bg-orange-500 animate-pulse align-middle"></span>}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-300 rounded-full flex items-center justify-center mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-slate-500 font-medium max-w-sm">Click Generate to stream a personalized cover letter.</p>
                        <p className="text-slate-400 text-sm mt-2 max-w-sm">After generating, use the ✨ Humanize button to reduce AI-detection and make it sound more natural.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
