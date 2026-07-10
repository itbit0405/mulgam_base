import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Wifi, CheckCircle2 } from 'lucide-react';
import { ArtistMock, User } from '../types';
import { MOCK_ARTISTS } from '../data';

interface NfcTagSimulatorProps {
  currentUser: User | null;
  onAddArtist: (serialNumber: string) => void;
  onOpenLogin: () => void;
  artists?: ArtistMock[];
}

export default function NfcTagSimulator({ currentUser, onAddArtist, onOpenLogin, artists = MOCK_ARTISTS }: NfcTagSimulatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [taggingState, setTaggingState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  const selectedArtist = (artists && artists.length > 0) ? artists[currentIndex % artists.length] : MOCK_ARTISTS[currentIndex % MOCK_ARTISTS.length];

  const handleSimulateTag = () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    setTaggingState('scanning');
    
    // Simulate a 1.5s NFC scan
    setTimeout(() => {
      onAddArtist(selectedArtist.serialNumber);
      setTaggingState('success');
      
      // Reset back to idle after 2 seconds and auto-switch to next artist card
      setTimeout(() => {
        setTaggingState('idle');
        if (artists && artists.length > 0) {
          setCurrentIndex((prev) => (prev + 1) % artists.length);
        } else {
          setCurrentIndex((prev) => (prev + 1) % MOCK_ARTISTS.length);
        }
      }, 2000);
    }, 1500);
  };

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-shadow" id="nfc-simulator-container">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 font-sans flex items-center justify-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          실시간 NFC 카드 태깅 시뮬레이터
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          작가 리스트를 고를 필요 없이, 전시 현장처럼 바로 카드를 태그해 보세요!
        </p>
      </div>

      <div className="flex flex-col items-center justify-center mt-4">
        {/* Simulated physical tag */}
        <div className="w-full max-w-md flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50 min-h-[280px]">
          <AnimatePresence mode="wait">
            {taggingState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col items-center text-center space-y-6 w-full"
              >
                {/* Physical Card Mockup */}
                <motion.div
                  whileHover={{ y: -6, rotate: -1, scale: 1.02 }}
                  className="relative w-64 h-40 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-5 shadow-xl flex flex-col justify-between overflow-hidden border border-white/20 cursor-pointer"
                  onClick={handleSimulateTag}
                >
                  {/* Glossy overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <Wifi className="h-6 w-6 text-white/80 rotate-90" />
                    <span className="text-[10px] font-mono tracking-widest bg-white/20 px-2 py-0.5 rounded-md uppercase font-semibold">NFC ART CARD</span>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/70 font-mono tracking-wider">SERIAL NUMBER</p>
                    <p className="text-base font-mono font-bold tracking-wider leading-none mt-1">{selectedArtist.serialNumber}</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-white/15 pt-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedArtist.profileImage}
                        alt={selectedArtist.name}
                        className="h-6 w-6 rounded-full object-cover border border-white/20"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs font-bold truncate max-w-[120px]">{selectedArtist.name.split('(')[0]}</span>
                    </div>
                    <span className="text-[9px] opacity-75 font-mono">TOUCH PHONE</span>
                  </div>
                </motion.div>

                <button
                  onClick={handleSimulateTag}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-[0.98] w-full max-w-[260px] justify-center"
                  id="simulate-tag-action-btn"
                >
                  <Smartphone className="h-4.5 w-4.5" />
                  스마트폰으로 태그 시뮬레이션
                </button>
              </motion.div>
            )}

            {taggingState === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75" />
                  <div className="relative h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Smartphone className="h-8 w-8 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 animate-pulse">카드를 태그하는 중...</h4>
                  <p className="text-xs text-gray-500 mt-1">스마트폰 뒷면에 NFC 카드를 대어주세요.</p>
                </div>
              </motion.div>
            )}

            {taggingState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="h-8 w-8 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-950">태깅 성공!</h4>
                  <p className="text-xs text-emerald-600 font-bold mt-1">[{selectedArtist.name}]</p>
                  <p className="text-xs text-gray-500 mt-2">
                    관심 작가로 등록되어<br />전시회 소식을 바로 받으실 수 있습니다.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
