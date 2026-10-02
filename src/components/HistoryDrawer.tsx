import React, { useState, useMemo } from 'react';
import { X, Trash2, Search, Calendar, ArrowRight, Bookmark, Download, Filter } from 'lucide-react';
import { HistoryItem } from '../types';
import { ConfirmDialog } from './Common/ConfirmDialog';
import { useToast } from './Common/Toast';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onSelectCalculation: (item: HistoryItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onDeleteItem,
  onSelectCalculation,
}) => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    history.forEach(h => {
      if (h.toolName) set.add(h.toolName);
    });
    return ['all', ...Array.from(set)];
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.toolName === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        item.toolName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.result.title.toLowerCase().includes(q) ||
        (item.result.inputsSummary && item.result.inputsSummary.some(i => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q)));

      return matchesCategory && matchesSearch;
    });
  }, [history, selectedCategory, search]);

  const handleExportHistory = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pb_civillab_history_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Calculation history exported successfully.');
    } catch {
      toast.error('Failed to export history.');
    }
  };

  const handleConfirmClear = () => {
    onClearHistory();
    setIsConfirmClearOpen(false);
    toast.info('Calculation history cleared.');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity no-print"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0B0F19] border-l border-white/10 shadow-2xl flex flex-col no-print animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            <h3 className="font-wood font-normal text-base text-slate-100 tracking-wide">
              Calculation History
            </h3>
            <span className="text-xs text-slate-400 font-mono">({history.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportHistory}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                  title="Export History JSON"
                  aria-label="Export history"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmClearOpen(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded transition-colors"
                  title="Clear all saved calculations"
                >
                  Clear All
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-white/5 bg-[#111827]/50 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by tool, value, or parameter..."
              className="w-full rounded-xl border border-white/10 bg-[#070B12] pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 font-medium"
            />
          </div>

          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <span className="text-slate-400 text-[10px] uppercase font-mono mr-1">Filter:</span>
              {categories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === c
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-2">
              <Bookmark className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-400">No Calculation Records Found</p>
              <p className="text-slate-500 text-[11px] max-w-xs mx-auto">
                {search ? `No saved calculations match "${search}".` : 'Calculations saved using the "Save" button will appear here for future verification and 1-click restore.'}
              </p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-white/10 bg-[#111827] hover:border-cyan-500/30 transition-all text-xs space-y-2.5 group shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-cyan-400 font-mono">{item.toolName}</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteItem(item.id);
                        toast.info('Item removed from history.');
                      }}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete record"
                      aria-label="Delete calculation record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-white tracking-tight">
                    {item.result.primaryValue} {item.result.primaryUnit}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCalculation(item);
                      onClose();
                      toast.info(`Restored ${item.toolName}`);
                    }}
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>Restore View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Input Parameters Summary */}
                {item.result.inputsSummary && item.result.inputsSummary.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5 text-[10px] text-slate-400">
                    {item.result.inputsSummary.slice(0, 3).map((inp, idx) => (
                      <span key={idx} className="bg-white/5 px-2 py-0.5 rounded font-mono">
                        {inp.label}: {inp.value}
                      </span>
                    ))}
                    {item.result.inputsSummary.length > 3 && (
                      <span className="text-slate-400 font-mono">+{item.result.inputsSummary.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Clearing History (Section 40) */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="Clear Calculation History?"
        message="This action will permanently delete all saved calculation records from this browser. This cannot be undone."
        confirmLabel="Clear All History"
        cancelLabel="Keep History"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </>
  );
};
