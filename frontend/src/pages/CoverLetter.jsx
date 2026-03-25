import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { FileText, Loader2, Copy, Check, Zap } from 'lucide-react';

export default function CoverLetter() {
    const navigate = useNavigate();
    const [letter, setLetter] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
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

        try {
            const response = await fetch('http://localhost:3001/api/cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidate: candidateData, jd: jdData, tone })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') { setIsGenerating(false); return; }
                        try {
                            const dataObj = JSON.parse(dataStr);
                            if (dataObj.chunk) { setLetter(prev => prev + dataObj.chunk); }
                        } catch (e) { }
                    }
                }
            }
        } catch (e) {
            toast.error("Generation failed.");
            setIsGenerating(false);
        }
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

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <select
                        value={tone}
                        onChange={e => setTone(e.target.value)}
                        disabled={isGenerating}
                        className="border-none bg-slate-50 rounded-lg text-sm font-medium focus:ring-0 cursor-pointer"
                    >
                        <option value="professional">Professional Tone</option>
                        <option value="enthusiastic">Enthusiastic Tone</option>
                        <option value="direct">Direct & Concise</option>
                    </select>
                    <button
                        onClick={generateLetter}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:from-orange-600 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        Generate
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px] flex flex-col">
                {letter ? (
                    <>
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 transition-colors"
                            >
                                {copied ? <Check size={16} className="text-orange-500" /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy Text'}
                            </button>
                        </div>
                        <div className="p-10 whitespace-pre-wrap text-slate-700 leading-relaxed font-serif text-lg flex-1">
                            {letter}
                            {isGenerating && <span className="inline-block w-2.5 h-5 ml-1 bg-orange-500 animate-pulse align-middle"></span>}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-300 rounded-full flex items-center justify-center mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-slate-500 font-medium max-w-sm">Click Generate to stream a personalized cover letter directly via the Groq API.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
