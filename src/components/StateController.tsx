import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, UserCheck, Eye, EyeOff, Sparkles, UserX, Palette, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { INITIAL_USER, INITIAL_ARTIST_USER, INITIAL_ADMIN_USER } from '../data';

interface StateControllerProps {
  currentUser: User | null;
  onStateChange: (user: User | null) => void;
}

export default function StateController({ currentUser, onStateChange }: StateControllerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const setLoggedOut = () => {
    localStorage.removeItem('nfc_platform_user');
    onStateChange(null);
  };

  const setRegularUser = () => {
    localStorage.setItem('nfc_platform_user', JSON.stringify(INITIAL_USER));
    onStateChange({ ...INITIAL_USER });
  };

  const setArtistUser = () => {
    localStorage.setItem('nfc_platform_user', JSON.stringify(INITIAL_ARTIST_USER));
    onStateChange({ ...INITIAL_ARTIST_USER });
  };

  const setAdminUser = () => {
    localStorage.setItem('nfc_platform_user', JSON.stringify(INITIAL_ADMIN_USER));
    onStateChange({ ...INITIAL_ADMIN_USER });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans" id="demo-state-controller-floating-widget">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="mb-3 w-64 rounded-2xl border border-indigo-100 bg-white/95 backdrop-blur-md p-4 shadow-xl"
          >
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-gray-900">데모 상태 컨트롤러</h4>
            </div>

            <p className="text-[10px] text-gray-400 mb-3 leading-normal">
              데이터베이스가 연동되기 전, 각 권한별 화면(일반인/작가/관리자)과 기능을 즉시 테스트하기 위해 제공되는 상태 스위처입니다.
            </p>

            <div className="space-y-2">
              {/* Logged Out */}
              <button
                onClick={setLoggedOut}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                  currentUser === null
                    ? 'bg-red-50 text-red-700 font-bold border border-red-100'
                    : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                }`}
                id="state-controller-logout-btn"
              >
                <span className="flex items-center gap-1.5">
                  <UserX className="h-3.5 w-3.5" />
                  비로그인 (게스트) 상태
                </span>
                {currentUser === null && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
              </button>

              {/* Regular User */}
              <button
                onClick={setRegularUser}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                  currentUser?.role === 'user'
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100'
                    : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                }`}
                id="state-controller-user-btn"
              >
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" />
                  일반 사용자 (김다솔)
                </span>
                {currentUser?.role === 'user' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
              </button>

              {/* Verified Artist */}
              <button
                onClick={setArtistUser}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                  currentUser?.role === 'artist'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                    : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                }`}
                id="state-controller-artist-btn"
              >
                <span className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 animate-pulse" />
                  인증된 작가 (하진)
                </span>
                {currentUser?.role === 'artist' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </button>

              {/* Admin User */}
              <button
                onClick={setAdminUser}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                  currentUser?.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100'
                    : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                }`}
                id="state-controller-admin-btn"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600 animate-bounce" />
                  최고 관리자 (Admin)
                </span>
                {currentUser?.role === 'admin' && <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 items-center gap-2 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-950/20 text-xs font-bold transition-all transform active:scale-95"
        id="toggle-state-controller-btn"
      >
        {isOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span>{isOpen ? '데모도구 닫기' : '데모 상태 스위치'}</span>
      </button>
    </div>
  );
}
