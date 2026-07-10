import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, LogOut, Settings, Palette, Menu, X, Sparkles, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'intro' | 'download' | 'mypage' | 'admin';
  setActiveTab: (tab: 'intro' | 'download' | 'mypage' | 'admin') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export default function Navbar({ currentUser, activeTab, setActiveTab, onOpenLogin, onLogout }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownItemClick = (tab: 'intro' | 'download' | 'mypage' | 'admin') => {
    setActiveTab(tab);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleUserIconClick = () => {
    if (!currentUser) {
      onOpenLogin();
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 border-b border-gray-100 backdrop-blur-md" id="main-navigation-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('intro')} 
            className="flex items-center gap-2 cursor-pointer group"
            id="nav-logo-area"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
              <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
            </div>
            <span className="font-sans font-extrabold text-2xl tracking-tight text-gray-900">
              mul<span className="text-indigo-600 font-bold">gam</span>
            </span>
          </div>

          {/* Desktop Navigation Menu (Top Right) */}
          <div className="hidden md:flex items-center gap-8" id="nav-desktop-menu">
            <button
              onClick={() => setActiveTab('intro')}
              className={`text-sm font-semibold transition-colors duration-200 ${
                activeTab === 'intro' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
              }`}
              id="nav-tab-intro"
            >
              서비스 소개
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className={`text-sm font-semibold transition-colors duration-200 ${
                activeTab === 'download' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
              }`}
              id="nav-tab-download"
            >
              앱 다운로드
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`text-sm font-bold transition-colors duration-200 flex items-center gap-1 ${
                  activeTab === 'admin' ? 'text-purple-600' : 'text-purple-500 hover:text-purple-700'
                }`}
                id="nav-tab-admin"
              >
                <ShieldCheck className="h-4 w-4" />
                관리자 모드
              </button>
            )}

            {/* Profile / Dropdown */}
            <div className="relative" ref={dropdownRef} id="nav-user-dropdown-container">
              <button
                onClick={handleUserIconClick}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                  currentUser 
                    ? 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                id="user-profile-nav-btn"
              >
                {currentUser ? (
                  <img
                    src={currentUser.profileImage}
                    alt={currentUser.nickname}
                    className="h-full w-full rounded-full object-cover border border-white"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="h-5 w-5 text-gray-500" />
                )}
                {currentUser?.role === 'artist' && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white border border-white">
                    P
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isDropdownOpen && currentUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-52 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-xl"
                    id="user-dropdown-menu"
                  >
                    <div className="px-3.5 py-3 border-b border-gray-100 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-900 truncate max-w-[120px]">{currentUser.nickname}</span>
                        {currentUser.role === 'artist' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            작가
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 block truncate mt-0.5">{currentUser.email}</span>
                    </div>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleDropdownItemClick('admin')}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-purple-700 hover:bg-purple-50 hover:text-purple-950 rounded-xl transition-colors text-left"
                        id="dropdown-admin-btn"
                      >
                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                        관리자 모드
                      </button>
                    )}

                    <button
                      onClick={() => handleDropdownItemClick('mypage')}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors text-left"
                      id="dropdown-mypage-btn"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      마이페이지
                    </button>
                    
                    <button
                      onClick={() => {
                        onLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors text-left mt-1"
                      id="dropdown-logout-btn"
                    >
                      <LogOut className="h-4 w-4 text-red-400" />
                      로그아웃
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Icon */}
          <div className="flex md:hidden items-center gap-3" id="nav-mobile-menu-trigger">
            <button
              onClick={handleUserIconClick}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${
                currentUser ? 'border-emerald-200' : 'border-gray-200'
              }`}
            >
              {currentUser ? (
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.nickname}
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="h-4.5 w-4.5 text-gray-500" />
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            id="mobile-nav-drawer"
          >
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => handleDropdownItemClick('intro')}
                className={`block w-full text-left py-2 px-3 text-sm font-semibold rounded-xl transition-colors ${
                  activeTab === 'intro' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                서비스 소개
              </button>
              <button
                onClick={() => handleDropdownItemClick('download')}
                className={`block w-full text-left py-2 px-3 text-sm font-semibold rounded-xl transition-colors ${
                  activeTab === 'download' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                앱 다운로드
              </button>

              {currentUser ? (
                <>
                  <div className="border-t border-gray-100 my-2 pt-2"></div>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => handleDropdownItemClick('admin')}
                      className={`block w-full text-left py-2 px-3 text-sm font-bold rounded-xl transition-colors ${
                        activeTab === 'admin' ? 'bg-purple-50 text-purple-700' : 'text-purple-500 hover:bg-purple-50'
                      }`}
                    >
                      관리자 모드
                    </button>
                  )}

                  <button
                    onClick={() => handleDropdownItemClick('mypage')}
                    className={`block w-full text-left py-2 px-3 text-sm font-semibold rounded-xl transition-colors ${
                      activeTab === 'mypage' ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    마이페이지
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-3 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onOpenLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-2.5 px-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
                >
                  로그인 / 회원가입
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
