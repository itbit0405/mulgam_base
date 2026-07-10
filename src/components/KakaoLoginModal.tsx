import { X, Sparkles, User as UserIcon, Palette, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { INITIAL_USER, INITIAL_ARTIST_USER } from '../data';

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function KakaoLoginModal({ isOpen, onClose, onLoginSuccess }: KakaoLoginModalProps) {
  if (!isOpen) return null;

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
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase text-center mb-2">
              테스트 계정 선택
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

          <div className="mt-8 text-center text-xs text-gray-400">
            <p>로그인 시 서비스 이용약관 및 개인정보 처리방침에</p>
            <p className="mt-1 font-medium underline cursor-pointer hover:text-gray-600">동의하게 됩니다.</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
