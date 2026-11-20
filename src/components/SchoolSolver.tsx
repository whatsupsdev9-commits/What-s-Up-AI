import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Send, 
  HelpCircle, 
  CheckCircle, 
  Calculator, 
  Atom, 
  BookOpen, 
  Globe2, 
  Languages, 
  Lightbulb, 
  Paperclip,
  Volume2,
  Copy,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';
import { speakText } from '../services/voiceService';

interface SchoolSolverProps {
  onAskAi: (question: string, attachedImage?: string) => void;
}

export const SchoolSolver: React.FC<SchoolSolverProps> = ({ onAskAi }) => {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState<'all' | 'math' | 'science' | 'english' | 'history' | 'language'>('all');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const subjects = [
    { id: 'all' as const, label: 'All Subjects', icon: GraduationCap, color: '#38bdf8' },
    { id: 'math' as const, label: 'Math & Algebra', icon: Calculator, color: '#f59e0b' },
    { id: 'science' as const, label: 'Science & Physics', icon: Atom, color: '#10b981' },
    { id: 'english' as const, label: 'English & Essays', icon: BookOpen, color: '#ec4899' },
    { id: 'history' as const, label: 'History & Civics', icon: Globe2, color: '#8b5cf6' },
    { id: 'language' as const, label: 'Foreign Languages', icon: Languages, color: '#06b6d4' },
  ];

  const quickQuestions = [
    {
      category: 'Math',
      q: 'Solve for x: 3x + 15 = 45 and show step-by-step',
      badge: 'Algebra'
    },
    {
      category: 'Science',
      q: 'What is photosynthesis and what is the chemical equation?',
      badge: 'Biology'
    },
    {
      category: 'English',
      q: 'Explain the difference between there, their, and they\'re with example sentences',
      badge: 'Grammar'
    },
    {
      category: 'History',
      q: 'What were the primary causes of World War 1? List the MAIN acronym',
      badge: 'World History'
    },
    {
      category: 'Multiple Choice',
      q: 'Which organelle is considered the powerhouse of the cell? A) Ribosome B) Mitochondria C) Nucleus D) Golgi apparatus',
      badge: 'Quiz'
    },
    {
      category: 'Physics',
      q: 'What is Newton\'s Second Law of Motion and what does F = ma mean with units?',
      badge: 'Physics'
    }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (qToSubmit?: string) => {
    const targetQ = qToSubmit || question;
    if (!targetQ.trim() && !attachedImage) return;

    const formattedPrompt = targetQ.trim() 
      ? `[SCHOOL & HOMEWORK QUESTION]: ${targetQ.trim()}`
      : `[SCHOOL & HOMEWORK WORKSHEET]: Please read all text in this attached picture, solve every question, and provide the exact DIRECT ANSWER at the top followed by clear steps.`;

    onAskAi(formattedPrompt, attachedImage || undefined);
    setQuestion('');
    setAttachedImage(null);
    setImageFileName(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0b192c] border border-[#1e3a8a]/50 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40">
              <GraduationCap className="w-6 h-6" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI School & Homework Solver
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0369a1]/30 text-[#7dd3fc] text-xs font-semibold border border-[#0284c7]/40">
              Direct Answers
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-2 max-w-2xl leading-relaxed">
            Get instant, 100% accurate answers with clear step-by-step explanations for **Math, Science, English, History, Foreign Languages, Multiple-Choice Tests, and Quizzes**. Upload a photo of any worksheet or test to solve immediately!
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0284c7]/30 shrink-0 transition-transform active:scale-95"
        >
          <Paperclip className="w-4 h-4" />
          <span>Upload Worksheet / Quiz</span>
        </button>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {subjects.map((s) => {
          const Icon = s.icon;
          const isSelected = subject === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium transition-all shrink-0 border ${
                isSelected
                  ? 'bg-[#1e293b] text-white border-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                  : 'bg-[#15171b] text-[#94a3b8] border-[#27292e] hover:text-white hover:bg-[#1e2025]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Question Input Box */}
      <div className="bg-[#181a1f] border border-[#2b2d33] rounded-3xl p-5 shadow-2xl space-y-4">
        {attachedImage && (
          <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#0284c7]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={attachedImage} alt="Worksheet preview" className="w-14 h-14 object-cover rounded-xl border border-[#38bdf8]/30" />
              <div>
                <p className="text-xs font-bold text-white truncate max-w-xs">{imageFileName || 'Worksheet / Quiz Attached'}</p>
                <p className="text-[11px] text-[#38bdf8]">What's Up AI will read all questions and write the Direct Answers!</p>
              </div>
            </div>
            <button
              onClick={() => { setAttachedImage(null); setImageFileName(null); }}
              className="text-xs text-[#94a3b8] hover:text-white px-2 py-1 bg-[#1e293b] rounded-lg"
            >
              Remove
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#ffd32a]" />
              <span>Type your question or homework problem:</span>
            </span>
            <span className="text-[10px] text-[#64748b]">Works for any grade: Elementary to College</span>
          </label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. 'What is the square root of 144?', 'Explain the water cycle', or 'A car travels 60 miles in 1.5 hours, what is its speed?'"
            className="w-full bg-[#111215] border border-[#2b2d33] rounded-2xl p-4 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8] resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-[#38bdf8] text-xs font-semibold border border-[#0284c7]/30 transition-all"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attach Quiz Photo</span>
          </button>

          <button
            onClick={() => handleSubmit()}
            disabled={!question.trim() && !attachedImage}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
              !question.trim() && !attachedImage
                ? 'bg-[#27292e] text-[#64748b] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-white hover:opacity-95 active:scale-95 shadow-[#0284c7]/20'
            }`}
          >
            <span>Get Direct Answer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Example School Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Instant School Practice & Examples:</span>
          </span>
          <span className="text-[11px] text-[#64748b]">Click any question to solve immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickQuestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSubmit(item.q)}
              className="p-4 rounded-2xl bg-[#16181c] border border-[#27292e] hover:border-[#38bdf8] cursor-pointer transition-all hover:scale-[1.02] shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] bg-[#0284c7]/15 px-2 py-0.5 rounded-md border border-[#0284c7]/30">
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-[#64748b]">{item.category}</span>
                </div>
                <p className="text-xs font-medium text-white group-hover:text-[#38bdf8] transition-colors leading-relaxed">
                  {item.q}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between text-[11px] text-[#64748b] border-t border-[#222429] mt-3">
                <span className="group-hover:text-white transition-colors">Click to solve</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#38bdf8]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
