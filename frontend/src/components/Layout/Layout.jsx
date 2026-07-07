import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-50 flex overflow-x-hidden relative">
      {/* Subtle background gradient mesh overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute -top-[40%] -left-[20%] w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute top-[20%] -right-[20%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="absolute -bottom-[30%] left-[30%] w-[650px] h-[650px] rounded-full bg-indigo-600/10 blur-[150px]" />
      </div>

      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        criticalCount={2} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[280px] relative z-10 transition-all duration-300">
        <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
