import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { UploadCloud, FileType, CheckCircle, Loader2, Target, Zap } from 'lucide-react';

export default function Upload() {
    const [file, setFile] = useState(null);
    const [jdText, setJdText] = useState('');
    const [jdUrl, setJdUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleAnalyze = async () => {
        if (!file) return toast.error("Please upload a resume (PDF).");
        if (!jdText && !jdUrl) return toast.error("Please provide Job Description text or URL.");

        setIsProcessing(true);
        let toastId = toast.loading("Parsing Job Description via Groq...");

        try {
            // 1. Parse JD
            let jdPayload = jdText ? { input_data: jdText, is_url: false } : { input_data: jdUrl, is_url: true };
            const jdRes = await API.post('/jd/parse', jdPayload);
            const jdData = jdRes.data;

            toast.loading("Extracting Resume data (NLP)...", { id: toastId });

            // 2. Upload & Parse Resume
            const formData = new FormData();
            formData.append('resume', file);
            const resumeRes = await API.post('/resume/upload', formData);
            const candidateData = resumeRes.data;

            toast.loading("Running Gap Analysis via Groq...", { id: toastId });

            // 3. Gap Analysis
            const gapRes = await API.post('/analyze', {
                candidate: candidateData,
                jd: jdData
            });

            // Save to local storage for other pages
            localStorage.setItem('candidateData', JSON.stringify(candidateData));
            localStorage.setItem('jdData', JSON.stringify(jdData));
            localStorage.setItem('gapData', JSON.stringify(gapRes.data));

            toast.success("Analysis Complete!", { id: toastId });
            setTimeout(() => navigate('/analysis'), 1000);

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || err.message || "Analysis failed.", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />

            <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Upload Credentials</h2>
                <p className="text-slate-500 mt-2 text-lg">Provide your resume and the target job description to begin AI-powered analysis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Side: Resume Upload */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
                        <FileType className="text-blue-500" size={20} />
                        1. Resume (PDF)
                    </h3>

                    <div
                        {...getRootProps()}
                        className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-10 transition-colors cursor-pointer min-h-[250px]
              ${isDragActive ? 'border-orange-400 bg-orange-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
              ${file ? 'bg-blue-50/50 border-blue-200' : ''}`}
                    >
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="flex flex-col items-center text-center">
                                <CheckCircle className="text-orange-500 mb-3" size={48} />
                                <p className="font-semibold text-navy-800">{file.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                                    <UploadCloud size={32} />
                                </div>
                                <p className="font-medium text-navy-800 text-lg">Drop your resume here</p>
                                <p className="text-sm text-slate-500 mt-2">or click to browse from your machine</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: JD */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
                        <Target className="text-orange-500" size={20} />
                        2. Target Job Description
                    </h3>

                    <div className="flex-1 flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Paste JD Text</label>
                            <textarea
                                className="w-full rounded-xl border border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 min-h-[160px] resize-none text-sm p-4 placeholder-slate-400 outline-none"
                                placeholder="Paste the full job description here..."
                                value={jdText}
                                onChange={(e) => setJdText(e.target.value)}
                                disabled={!!jdUrl}
                            />
                        </div>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium uppercase tracking-wider">or</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Job Post URL</label>
                            <input
                                type="url"
                                className="w-full rounded-xl border border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 text-sm placeholder-slate-400 outline-none"
                                placeholder="https://linkedin.com/jobs/..."
                                value={jdUrl}
                                onChange={(e) => setJdUrl(e.target.value)}
                                disabled={!!jdText}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleAnalyze}
                    disabled={!file || (!jdText && !jdUrl) || isProcessing}
                    className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all duration-300
            ${!file || (!jdText && !jdUrl) || isProcessing
                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 hover:-translate-y-0.5'}`}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            Analyzing via Groq...
                        </>
                    ) : (
                        <><Zap size={20} /> Analyze Match</>
                    )}
                </button>
            </div>
        </div>
    );
}
