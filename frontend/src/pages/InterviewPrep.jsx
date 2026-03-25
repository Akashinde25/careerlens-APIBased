import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, MessageSquare, Terminal, Users, Check, Target } from 'lucide-react';

export default function InterviewPrep() {
    const navigate = useNavigate();
    const [prep, setPrep] = useState(null);
    const [isGenerating, setIsGenerating] = useState(true);

    useEffect(() => {
        const candidateData = JSON.parse(localStorage.getItem('candidateData'));
        const jdData = JSON.parse(localStorage.getItem('jdData'));

        if (!candidateData || !jdData) { navigate('/'); return; }

        const generate = async () => {
            try {
                const res = await API.post('/interview-prep', {
                    candidate: candidateData,
                    jd: jdData
                });
                setPrep(res.data);
            } catch (err) {
                toast.error("Failed to generate prep document.");
            } finally {
                setIsGenerating(false);
            }
        };

        generate();
    }, [navigate]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Toaster position="top-right" />

            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Interview Intelligence</h2>
                <p className="text-slate-500 mt-2 text-lg">Custom questions predicted on the intersection of your resume and the JD.</p>
            </div>

            {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-navy-900">Formulating interview blueprint via Groq...</h3>
                    <p className="text-slate-500 mt-2 text-sm">Identifying areas an interviewer is most likely to probe.</p>
                </div>
            ) : prep && !prep.error ? (
                <div className="space-y-8">

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                        <h3 className="flex items-center gap-3 text-xl font-bold text-navy-900 mb-6 pb-4 border-b border-slate-100">
                            <Terminal className="text-blue-500" />
                            Technical Screen
                        </h3>
                        <div className="space-y-6">
                            {(prep.technical_questions || []).map((q, i) => (
                                <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-800 text-lg mb-2"><span className="text-blue-500 mr-2">Q:</span>{q.question}</p>
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Ideal Answer Structure</p>
                                        <p className="text-slate-700 text-sm leading-relaxed">{q.ideal_answer_structure}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                        <h3 className="flex items-center gap-3 text-xl font-bold text-navy-900 mb-6 pb-4 border-b border-slate-100">
                            <Users className="text-purple-500" />
                            Behavioral & Leadership
                        </h3>
                        <div className="space-y-6">
                            {(prep.behavioral_questions || []).map((q, i) => (
                                <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-800 text-lg mb-2"><span className="text-purple-500 mr-2">Q:</span>{q.question}</p>
                                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">STAR Format Hint</p>
                                        <p className="text-slate-700 text-sm italic">"{q.star_format_hint}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <h3 className="flex items-center gap-3 text-xl font-bold text-navy-900 mb-6 pb-4 border-b border-slate-100">
                                <Target className="text-orange-500" />
                                System Design Focus
                            </h3>
                            {(prep.system_design_question || prep.system_design) && (
                                <div>
                                    <p className="font-bold text-slate-800 mb-4">{(prep.system_design_question || prep.system_design).question}</p>
                                    <ul className="space-y-2">
                                        {((prep.system_design_question || prep.system_design).key_considerations || []).map((kc, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-600 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100">
                                                <Check size={16} className="text-orange-400 mt-0.5" /> {kc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <h3 className="flex items-center gap-3 text-xl font-bold text-navy-900 mb-6 pb-4 border-b border-slate-100">
                                <MessageSquare className="text-emerald-500" />
                                Questions for Them
                            </h3>
                            <ul className="space-y-3">
                                {(prep.questions_to_ask_interviewer || []).map((q, i) => (
                                    <li key={i} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-slate-700 text-sm font-medium">
                                        {q}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="p-10 text-center bg-red-50 text-red-600 rounded-3xl border border-red-200">
                    <p>Failed to generate structured data. Try regenerating.</p>
                </div>
            )}
        </div>
    );
}
