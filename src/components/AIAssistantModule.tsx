import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  FileCheck2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { AIMessage, AppSettings, CalculationResult, HistoryItem } from '../types';
import { Logo } from './Logo';

interface AIAssistantModuleProps {
  settings: AppSettings;
  history: HistoryItem[];
  onNavigateToTool?: (toolId: string) => void;
}

export const AIAssistantModule: React.FC<AIAssistantModuleProps> = ({
  settings,
  history,
  onNavigateToTool,
}) => {
  const [activeTab, setActiveTab] = useState<'consultant' | 'audit'>('consultant');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Chat messages state with initial greeting
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `### Welcome to PB CivilLab AI Advisor
I am your **AI Civil & Structural Engineering Consultant**, powered by Google Gemini.

I can help you with:
- **Code Compliance**: Standards verification according to **BNBC**, **ACI 318**, **IS 456**, **Eurocode 2**, and **ASTM**.
- **Structural Detailing**: Minimum steel requirements, beam stirrup spacing, column tie rules, development lengths ($L_d$), and lap splices.
- **Concrete Technology**: Water-cement ratio optimization, aggregate grading, mix proportions (M15–M35), slump tests, and admixtures.
- **Site Problem Solving**: Honeycombing prevention, cold joints, curing durations, soil compaction, and formwork striking times.
- **Calculations Audit**: Instant sanity check on structural member dimensions or quantity estimates.

Select a quick topic below or type your technical query!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Audit Tab State
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');
  const [customAuditText, setCustomAuditText] = useState('');
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'consultant') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const quickPrompts = [
    {
      label: 'Minimum Steel for Beams',
      prompt: 'What are the minimum and maximum longitudinal reinforcement percentages and clear cover for RCC beams under BNBC and ACI 318?',
    },
    {
      label: 'Concrete Mix Water-Cement Ratio',
      prompt: 'How does the water-cement ratio affect compressive strength and durability of M20/M25 concrete? What is the recommended w/c ratio on site?',
    },
    {
      label: 'Column Lateral Ties & Spacing',
      prompt: 'What are the code rules for column tie diameter and pitch spacing (minimum 16 bar diameters, 48 tie diameters, or least lateral dimension) according to ACI 318 / IS 456?',
    },
    {
      label: 'Development Length (Ld) Formula',
      prompt: 'Explain the development length Ld calculation for deformed bars in tension. How much lap length should be provided for 16mm and 20mm rebar?',
    },
    {
      label: 'Sand Bulking & Batch Correction',
      prompt: 'Why does moist sand experience volume bulking? How should field batching volumes be corrected when moisture is between 4% and 6%?',
    },
    {
      label: 'Formwork Striking Time',
      prompt: 'What are the standard minimum shuttering/formwork removal periods for beam sides, slab soffits, and beam soffits as per building codes?',
    },
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: textToSend,
          conversationContext: messages.slice(-5),
        }),
      });
      clearTimeout(timeoutId);

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server error (HTTP ${response.status})` };
      }

      if (!response.ok) {
        throw new Error(data.error || `Server returned status ${response.status}`);
      }

      const assistantMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      const isGithubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
      const errorMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isAbort
          ? '**Engineering Assistant Notice:** Request timed out after 35 seconds. Please try asking again.'
          : isGithubPages
          ? '**Engineering Assistant Notice:** You are viewing the static GitHub Pages deployment. All 27+ calculators, unit converters, takeoff tools, and printable reports work 100% offline in your browser. The AI Consultant API requires a backend server (e.g. Google Cloud Run, Render, or Railway).'
          : `**Engineering Assistant Notice:** ${err?.message || 'Unable to connect to Gemini API. Please verify server status.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditCalculation = async (calcData?: CalculationResult) => {
    let targetCalc = calcData;

    if (!targetCalc && selectedHistoryId) {
      const found = history.find(h => h.id === selectedHistoryId);
      if (found) targetCalc = found.result;
    }

    if (!targetCalc && !customAuditText) {
      setAuditError('Please select a calculation from history or enter technical details to audit.');
      return;
    }

    setIsAuditing(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const payload = targetCalc || {
        title: 'Custom Engineering Query',
        primaryValue: customAuditText,
        primaryUnit: 'User Entry',
        inputsSummary: [{ label: 'Input Text', value: customAuditText }],
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ calculation: payload }),
      });
      clearTimeout(timeoutId);

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server error (HTTP ${response.status})` };
      }

      if (!response.ok) {
        throw new Error(data.error || 'Audit request failed');
      }

      setAuditResult(data.audit);
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      const isGithubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
      setAuditError(
        isAbort
          ? 'Audit request timed out after 35 seconds. Please try again.'
          : isGithubPages
          ? 'AI Verification requires a backend server. On static GitHub Pages, all 27 mathematical calculators and takeoff tools work offline.'
          : err?.message || 'Error occurred while contacting audit service.'
      );
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[#0E1726] to-[#0B0F19] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                AI CIVIL ADVISOR • GEMINI 3.8 FLASH
              </span>
              <span className="text-[11px] text-slate-400 font-mono">BNBC • ACI 318 • IS 456 • ASTM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-wood font-normal text-white tracking-wide flex items-center gap-2">
              <Logo variant="icon" height={22} />
              <span>PB CivilLab Engineering Intelligence</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Real-time engineering consultation, building code compliance checks, mix design optimization, and calculation audits powered by Google Gemini.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-lg border border-white/10 bg-[#070B12] p-1 shrink-0">
            <button
              onClick={() => setActiveTab('consultant')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'consultant'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Technical Consultant
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Calculation Auditor
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: TECHNICAL CONSULTANT CHAT */}
      {activeTab === 'consultant' && (
        <div className="space-y-4">
          {/* Quick Prompts Carousel */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Technical Topics</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#111827] hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <BookOpen className="w-3 h-3 text-cyan-400" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="rounded-xl border border-white/10 bg-[#0B0F19] flex flex-col h-[560px] overflow-hidden shadow-2xl">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isAssistant
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                      }`}
                    >
                      {isAssistant ? <Logo variant="icon" height={20} /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group ${
                        isAssistant
                          ? 'bg-[#111827] border border-white/10 text-slate-200'
                          : 'bg-cyan-600 text-white font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 border-b border-white/5 pb-1 mb-2 font-mono">
                        <span>{isAssistant ? 'PB CivilLab Advisor' : 'Civil Engineer'}</span>
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          {isAssistant && (
                            <button
                              onClick={() => handleCopy(msg.content, index)}
                              className="text-slate-400 hover:text-white transition-colors"
                              title="Copy response"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content with basic markdown formatting */}
                      <div className="prose prose-invert prose-xs max-w-none text-slate-200 whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl p-4 text-xs bg-[#111827] border border-white/10 text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Consulting engineering database and building codes...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#111827]">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={e => setInputPrompt(e.target.value)}
                  placeholder="Ask any civil, structural, concrete, surveying, or code compliance question..."
                  className="flex-1 rounded-xl border border-white/10 bg-[#0B0F19] px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Calculations are advisory and follow recognized international civil standards.</span>
                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: 'reset-1',
                        role: 'assistant',
                        content: 'Chat history cleared. How can I assist your engineering work today?',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ])
                  }
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALCULATION AUDITOR */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Input Selection */}
          <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#111827] p-5 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h3>Select Calculation to Audit</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify accuracy, code compliance (BNBC/ACI/IS), and uncover critical site failure modes before construction.
            </p>

            {/* From History Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Load from Saved Calculations ({history.length})
              </label>
              {history.length > 0 ? (
                <select
                  value={selectedHistoryId}
                  onChange={e => {
                    setSelectedHistoryId(e.target.value);
                    const item = history.find(h => h.id === e.target.value);
                    if (item) {
                      setCustomAuditText(
                        `${item.toolName}: ${item.result.title}\nPrimary Output: ${item.result.primaryValue} ${item.result.primaryUnit}\nFormula: ${item.result.formula || ''}`
                      );
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs font-mono text-slate-200 cursor-pointer"
                >
                  <option value="">-- Choose from History --</option>
                  {history.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.toolName} ({item.summary})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-lg border border-white/5 bg-[#0B0F19] text-xs text-slate-400">
                  No calculation history found. Perform a calculation in any tool and click "Save to History" or use the direct audit button in the Result Panel.
                </div>
              )}
            </div>

            {/* Custom Technical Query / Details */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Or Enter / Edit Technical Specifications
              </label>
              <textarea
                rows={6}
                value={customAuditText}
                onChange={e => setCustomAuditText(e.target.value)}
                placeholder="e.g. Beam: Span 6m, Width 250mm, Depth 500mm, 4 nos 20mm bottom bars, 8mm stirrups @ 150mm c/c. Concrete M20. Verify shear and flexural capacity."
                className="w-full rounded-lg border border-white/10 bg-[#0B0F19] p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {auditError && (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{auditError}</span>
              </div>
            )}

            <button
              onClick={() => handleAuditCalculation()}
              disabled={isAuditing}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {isAuditing ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Auditing with AI Civil Consultant...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Run Formal Engineering Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Audit Report Output */}
          <div className="lg:col-span-7 rounded-xl border border-white/10 bg-[#111827] p-6 space-y-4 min-h-[400px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4>Technical Audit Report</h4>
              </div>
              {auditResult && (
                <button
                  onClick={() => handleCopy(auditResult, 999)}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedIndex === 999 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Report
                    </>
                  )}
                </button>
              )}
            </div>

            {auditResult ? (
              <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {auditResult}
              </div>
            ) : isAuditing ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  Reviewing dimensional ratios, reinforcement densities, and code compliance...
                </p>
                <span className="text-[11px] text-slate-500 font-mono">Checking BNBC 2020 & ACI 318-19 criteria</span>
              </div>
            ) : (
              <div className="py-24 text-center space-y-2 text-slate-400">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs">No audit report generated yet.</p>
                <p className="text-[11px] text-slate-400">
                  Select a saved calculation on the left or enter specifications to run an AI audit.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
