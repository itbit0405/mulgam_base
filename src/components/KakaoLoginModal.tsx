import React, { useState, useEffect } from 'react';
import { X, Sparkles, User as UserIcon, Palette, Mail, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { INITIAL_USER, INITIAL_ARTIST_USER, INITIAL_ADMIN_USER } from '../data';

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function KakaoLoginModal({ isOpen, onClose, onLoginSuccess }: KakaoLoginModalProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    
    const isValidId = adminId.trim() === 'admin' || adminId.trim() === 'admin@nfcartlink.com';
    const isValidPw = adminPassword === 'admin123' || adminPassword === '1234';

    if (isValidId && isValidPw) {
      // Login successful!
      localStorage.setItem('nfc_platform_user', JSON.stringify(INITIAL_ADMIN_USER));
      onLoginSuccess(INITIAL_ADMIN_USER);
      onClose();
      // Reset form
      setAdminId('');
      setAdminPassword('');
      setShowAdminForm(false);
    } else {
      setAdminError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview, localhost, or Vercel
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('vercel.app')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        const loggedInUser = event.data.user;
        
        // Save to localStorage so state persists beautifully across reloads
        localStorage.setItem('nfc_platform_user', JSON.stringify(loggedInUser));
        
        onLoginSuccess(loggedInUser);
        onClose();
        setIsLoggingIn(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleRealKakaoLogin = async () => {
    try {
      setIsLoggingIn(false); // Reset just in case
      const backendUrl = window.location.origin.includes('vercel.app')
        ? 'https://ais-pre-tnsbfut3hefguantpepxav-541849461180.asia-northeast1.run.app'
        : window.location.origin;

      const redirectUri = window.location.origin.includes('vercel.app')
        ? 'https://mulgam-lovat.vercel.app/oauth'
        : `${window.location.origin}/auth/callback`;

      const res = await fetch(`${backendUrl}/api/auth/kakao/url?origin=${encodeURIComponent(window.location.origin)}&redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!res.ok) throw new Error('API failed');
      const { url } = await res.json();

      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'kakao_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        alert('팝업 차단이 감지되었습니다. 브라우저 설정에서 팝업 차단을 해제하고 다시 시도해주세요.');
      } else {
        setIsLoggingIn(true);
      }
    } catch (err) {
      console.error(err);
      alert('카카오 로그인 URL을 가져오는 데 실패했습니다.');
    }
  };

  const handleLogin = (type: 'user' | 'artist') => {
    const selectedUser = type === 'user' ? { ...INITIAL_USER } : { ...INITIAL_ARTIST_USER };
    
    // Save to localStorage so state persists beautifully across reloads
    localStorage.setItem('nfc_platform_user', JSON.stringify(selectedUser));
    
    onLoginSuccess(selectedUser);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
          id="kakao-login-modal-box"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            id="close-login-btn"
          >
            <X className="h-5 w-5" />
          </button>

          {showAdminForm ? (
            /* Admin ID/PW Login View */
            <div className="space-y-6 text-left pt-2" id="admin-login-view">
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 font-sans">
                  시스템 관리자 로그인
                </h3>
                <p className="mt-1.5 text-xs text-gray-500">
                  아이디와 비밀번호를 입력하여 시스템에 관리자로 직접 로그인합니다.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">아이디 (또는 이메일)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="admin 또는 admin@nfcartlink.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-sans"
                      id="admin-login-id"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">비밀번호</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-sans"
                      id="admin-login-password"
                    />
                  </div>
                </div>

                {adminError && (
                  <p className="text-xs font-semibold text-red-500 bg-red-50 py-2 px-3 rounded-xl border border-red-100">
                    ⚠️ {adminError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminForm(false);
                      setAdminError('');
                    }}
                    className="flex-1 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    뒤로 가기
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-purple-100"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    로그인
                  </button>
                </div>
              </form>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block mb-0.5">💡 관리자 계정 정보</span>
                <span className="block">• 아이디: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-purple-600">admin</code></span>
                <span className="block">• 비밀번호: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-purple-600">admin123</code></span>
              </div>
            </div>
          ) : (
            /* Standard Kakao Login Flow */
            <>
              {/* Logo / Brand Header */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans">
                  반갑습니다!
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  커스텀 NFC 카드로 시작하는<br />
                  나만의 특별한 일러스트 컬렉션
                </p>
              </div>

              {/* Login Selection */}
              <div className="space-y-4">
                {/* Real Kakao Login Button */}
                <button
                  onClick={handleRealKakaoLogin}
                  disabled={isLoggingIn}
                  className={`flex w-full items-center justify-between rounded-2xl bg-[#FEE500] hover:bg-[#FEE500]/95 px-6 py-4 text-left font-medium text-[#191919] transition-all transform active:scale-[0.99] shadow-md hover:shadow-lg border border-yellow-400 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                  id="kakao-real-login-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A1D1D]/10">
                      <svg className="h-5 w-5 fill-[#3A1D1D]" viewBox="0 0 24 24">
                        <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.316 6.007-.173.647-.624 2.338-.713 2.695-.11.439.162.433.342.313.14-.093 2.228-1.503 3.125-2.112.637.11 1.298.17 1.93.17 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-[#3A1D1D]">실제 카카오 로그인</div>
                      <div className="text-xs text-[#3A1D1D]/70">{isLoggingIn ? '카카오 로그인 팝업 활성화 중...' : '내 카카오 계정으로 안전하게 연동'}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#3A1D1D] text-[#FEE500] px-2 py-1 rounded-md font-extrabold">REAL KAKAO</span>
                </button>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <span className="relative bg-white px-3 text-[10px] font-bold text-gray-400 tracking-wider uppercase">또는</span>
                </div>

                <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase text-center mb-1">
                  테스트 계정으로 즉시 간편 접속
                </p>

                {/* Kakao Login Option 1: Regular User */}
                <button
                  onClick={() => handleLogin('user')}
                  className="flex w-full items-center justify-between rounded-2xl bg-[#FEE500] hover:bg-[#FEE500]/95 px-6 py-4 text-left font-medium text-[#191919] transition-all transform active:scale-[0.99] shadow-sm hover:shadow-md"
                  id="kakao-user-login-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50">
                      <UserIcon className="h-5 w-5 text-yellow-950" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">카카오 계정으로 로그인</div>
                      <div className="text-xs text-yellow-950/70">일반 사용자 계정 (김다솔)</div>
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-950/10 px-2 py-1 rounded-md font-semibold">간편 접속</span>
                </button>

                {/* Kakao Login Option 2: Artist */}
                <button
                  onClick={() => handleLogin('artist')}
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-900 hover:bg-slate-800 px-6 py-4 text-left font-medium text-white transition-all transform active:scale-[0.99] shadow-sm hover:shadow-md"
                  id="kakao-artist-login-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Palette className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">카카오 작가로 로그인</div>
                      <div className="text-xs text-slate-300">인증된 작가 계정 (하진)</div>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-1 rounded-md font-semibold">작가 접속</span>
                </button>
              </div>

              <div className="mt-6 text-center text-xs text-gray-400 space-y-3">
                <div>
                  <p>로그인 시 서비스 이용약관 및 개인정보 처리방침에</p>
                  <p className="mt-1 font-medium underline cursor-pointer hover:text-gray-600">동의하게 됩니다.</p>
                </div>
                
                <div className="pt-3 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => {
                      setShowAdminForm(true);
                      setAdminError('');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                    id="show-admin-login-btn"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    시스템 관리자 로그인
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
