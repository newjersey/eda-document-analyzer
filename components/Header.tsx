"use client";
/**
 * Header.jsx
 * ----------
 * Displays the application title as a colourful gradient as well as a
 * theme-toggle button.  It does not manage its own state; instead the
 * dark/light state and its setter are injected from the parent so the
 * header can be reused anywhere.
 *
 * Props
 * -----
 * • isDarkMode: boolean – current theme.
 * • toggleTheme: () => void – flips the theme, implemented in parent.
 * • onRefresh: () => void – function to refresh/reset the entire application.
 */

import { Moon, RefreshCw, Sun } from "lucide-react";

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onRefresh: () => void;
}

export default function Header({ isDarkMode, toggleTheme, onRefresh }: HeaderProps) {
  return (
    <div className="text-center mb-7 flex-shrink-0 pt-4 pb-2 relative">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`absolute top-0 right-0 p-3 rounded-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${
          isDarkMode
            ? "bg-gray-800/50 hover:bg-gray-700/50 text-yellow-400 focus:ring-yellow-500/20 border border-gray-700"
            : "bg-white/50 hover:bg-white/70 text-gray-600 focus:ring-blue-500/20 border border-gray-200"
        } backdrop-blur-sm shadow-lg`}
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <Sun className="h-6 w-6" />
        ) : (
          <Moon className="h-6 w-6" />
        )}
      </button>

      {/* Refresh Button - Added next to theme toggle */}
      <button
        onClick={onRefresh}
        className={`absolute top-0 right-16 p-3 rounded-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${
          isDarkMode
            ? "bg-gray-800/50 hover:bg-gray-700/50 text-green-400 focus:ring-green-500/20 border border-gray-700"
            : "bg-white/50 hover:bg-white/70 text-green-600 focus:ring-green-500/20 border border-gray-200"
        } backdrop-blur-sm shadow-lg`}
        aria-label="Start new review"
        title="Start New Review"
      >
        <RefreshCw className="h-6 w-6" />
      </button>

      <h1 className={`text-5xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r ${
        isDarkMode
          ? "from-blue-400 via-indigo-400 to-purple-400"
          : "from-blue-600 via-indigo-600 to-purple-600"
      } bg-clip-text text-transparent flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-0`}>
        NJ EASE
        <div className={`w-32 h-px ${isDarkMode ? "bg-gray-600" : "bg-gray-400"} my-2 block lg:hidden`}></div>
        <div className={`w-px h-10 ${isDarkMode ? "bg-gray-600" : "bg-gray-400"} mx-4 hidden lg:block`}></div> 
        <span className={`bg-gradient-to-r ${
          isDarkMode
            ? "from-gray-300 via-slate-300 to-gray-200"
            : "from-gray-700 via-slate-700 to-gray-800"
        } bg-clip-text text-transparent text-2xl lg:text-2xl xl:text-3xl`}>Entrepreneurial Application Screening Engine</span>
      </h1>
    </div>
  );
}
