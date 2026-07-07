import React from 'react';
import { motion } from 'framer-motion';
import { MdSmartToy } from 'react-icons/md';

const ChatMessage = ({ message }) => {
  if (!message) return null;

  const { role, content, timestamp, action_taken, isTyping, isError } = message;

  const formatInlineBold = (text) => {
    if (!text || typeof text !== 'string') return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderFormattedContent = (str) => {
    if (!str || typeof str !== 'string') return null;
    const lines = str.split('\n');
    return (
      <div className="text-sm text-slate-200 leading-relaxed space-y-1">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
            const itemText = trimmed.replace(/^[•-]\s*/, '');
            return (
              <div key={index} className="flex items-start gap-2 pl-1">
                <span className="text-blue-400 font-bold">•</span>
                <span>{formatInlineBold(itemText)}</span>
              </div>
            );
          }
          return (
            <p key={index} className="min-h-[0.5rem]">
              {formatInlineBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderActionBadge = (action) => {
    if (!action || action === 'general_conversation' || isTyping) return null;

    const badgeConfig = {
      create_patient: { text: 'Patient Created', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
      assign_bed: { text: 'Bed Assigned', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
      release_bed: { text: 'Bed Released', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
      get_stats: { text: 'Stats Retrieved', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
      get_patients: { text: 'Patients Listed', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
      get_beds: { text: 'Beds Listed', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
      get_emergency_queue: { text: 'Queue Retrieved', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
      get_patient_detail: { text: 'Patient Details', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
      run_analysis: { text: 'Analysis Triggered', className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
      error: { text: 'Error', className: 'bg-red-500/20 text-red-400 border border-red-500/30' }
    };

    const config = badgeConfig[action];
    if (!config) return null;

    return (
      <div className="mt-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium inline-block ${config.className}`}>
          {config.text}
        </span>
      </div>
    );
  };

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end mb-4"
      >
        <div className="max-w-[75%]">
          <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
          {formattedTime && (
            <div className="text-blue-200 text-xs mt-1 text-right">
              {formattedTime}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-4 gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400 text-sm">
        <MdSmartToy className="w-5 h-5" />
      </div>

      <div className="max-w-[80%]">
        {isTyping ? (
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1.5 items-center py-1">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.15 }}
                  className="w-2 h-2 bg-slate-400 rounded-full"
                />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="text-sm text-red-300 leading-relaxed">
              {content}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
            {renderFormattedContent(content)}
            {renderActionBadge(action_taken)}
          </div>
        )}

        {!isTyping && formattedTime && (
          <div className="text-slate-500 text-xs mt-1">
            {formattedTime}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
