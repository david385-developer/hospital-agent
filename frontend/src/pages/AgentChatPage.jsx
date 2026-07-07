import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import ChatMessage from '../components/Chat/ChatMessage';
import {
  MdSend,
  MdSmartToy,
  MdPeople,
  MdHotel,
  MdWarning,
  MdAutoAwesome,
  MdBarChart,
  MdPerson,
  MdRefresh
} from 'react-icons/md';

const DEFAULT_WELCOME = {
  role: "assistant",
  content: "Hello! I'm MedOps AI, your hospital operations assistant. I can help you:\n\n• **Admit patients** — \"Admit a 45-year-old man named Robert with chest pain\"\n• **Manage beds** — \"Assign an ICU bed to Maria Garcia\"\n• **View stats** — \"Show me hospital statistics\"\n• **Check queues** — \"What's the emergency queue?\"\n• **Run analysis** — \"Run AI triage on patient P-1042\"\n\nWhat would you like to do?",
  timestamp: new Date().toISOString(),
  action_taken: null
};

const AgentChatPage = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("medops_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
    return [DEFAULT_WELCOME];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/agent/stats', {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch agent stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("medops_chat_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history:", e);
    }
  }, [messages]);

  const clearChat = () => {
    const welcome = { ...DEFAULT_WELCOME, timestamp: new Date().toISOString() };
    setMessages([welcome]);
    localStorage.removeItem("medops_chat_messages");
  };

  const sendMessage = async (text) => {
    if (!text || !text.trim() || isTyping) return;

    const userText = text.trim();
    const userMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    const history = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/agent/chat',
        {
          message: userText,
          conversation_history: history
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        }
      );

      if (response.data && response.data.success) {
        const data = response.data.data;
        const assistantMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          action_taken: data.action_taken,
          result: data.result
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.updated_stats) {
          setStats(data.updated_stats);
        } else if (['create_patient', 'assign_bed', 'release_bed'].includes(data.action_taken)) {
          fetchStats();
        }
      } else {
        throw new Error(response.data?.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to communicate with AI Agent');
      const errorMessage = {
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
        action_taken: 'error'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  };

  const quickActions = [
    { label: 'Show Stats', icon: MdBarChart, message: 'Show me hospital statistics' },
    { label: 'Add Patient', icon: MdPerson, message: 'I need to admit a new patient' },
    { label: 'Bed Status', icon: MdHotel, message: 'Show bed availability' },
    { label: 'Emergency Queue', icon: MdWarning, message: 'Show the emergency queue' },
    { label: 'Run AI Analysis', icon: MdAutoAwesome, message: 'Run AI triage analysis' }
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const occupancyPct = stats?.overall_occupancy_pct || 0;
  const barColor = occupancyPct > 85 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-green-500';
  const emergencyCount = stats?.emergency_queue_count || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Top Header with Refresh */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
            <MdSmartToy className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">AI Operations Assistant</h1>
        </div>
        <button
          onClick={fetchStats}
          title="Refresh KPI Stats"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <MdRefresh className="w-4 h-4" />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* KPI CARDS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 text-blue-400 rounded-lg p-2 flex items-center justify-center">
              <MdPeople className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-400">Total Patients</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.total_patients !== undefined ? stats.total_patients : '—'}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 text-green-400 rounded-lg p-2 flex items-center justify-center">
              <MdHotel className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-400">Bed Occupancy</span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {stats?.total_occupied || 0}/{stats?.total_beds || 55}
          </div>
          <div className="bg-slate-700 rounded-full h-1.5 w-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, occupancyPct))}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/20 text-amber-400 rounded-lg p-2 flex items-center justify-center">
              <MdWarning className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-400">Emergency Queue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {emergencyCount}
            </span>
            {emergencyCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 text-purple-400 rounded-lg p-2 flex items-center justify-center">
              <MdAutoAwesome className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-400">AI Analyses</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.total_analyses !== undefined ? stats.total_analyses : '0'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MdSmartToy className="text-violet-400" />
          AI Agent Chat
        </h2>
        <button
          onClick={clearChat}
          className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Clear Chat
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((m, index) => (
            <ChatMessage key={index} message={m} />
          ))}
          {isTyping && (
            <ChatMessage key="typing" message={{ role: 'assistant', content: 'typing', isTyping: true }} />
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 p-4">
        {/* Quick actions row */}
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
          {quickActions.map((action, idx) => {
            const IconComponent = action.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(action.message)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <IconComponent className="w-4 h-4 text-blue-400" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input row */}
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            placeholder="Type a command or ask a question..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none min-h-[48px] max-h-[120px]"
          />
          <button
            type="button"
            onClick={() => sendMessage(inputMessage)}
            disabled={isTyping || !inputMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-colors shrink-0"
          >
            <MdSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChatPage;
