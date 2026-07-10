import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, CreditCard, Wifi, CheckCircle2, RefreshCw } from 'lucide-react';
import { ArtistMock, User } from '../types';
import { MOCK_ARTISTS } from '../data';

interface NfcTagSimulatorProps {
  currentUser: User | null;
  onAddArtist: (serialNumber: string) => void;
  onOpenLogin: () => void;
  artists?: ArtistMock[];
}

export default function NfcTagSimulator({ currentUser, onAddArtist, onOpenLogin, artists = MOCK_ARTISTS }: NfcTagSimulatorProps) {
  const [selectedArtist, setSelectedArtist] = useState<ArtistMock>(artists[0] || MOCK_ARTISTS[0]);
  const [taggingState, setTaggingState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  const handleSimulateTag = () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    setTaggingState('scanning');
    
    // Simulate a 1.5s NFC scan
    setTimeout(() => {
      if (currentUser.favoriteArtists.includes(selectedArtist.serialNumber)) {
        setTaggingState('success'); // Already registered but show success
        setTimeout(() => setTaggingState('idle'), 2000);
        return;
      }

      onAddArtist(selectedArtist.serialNumber);
      setTaggingState('success');
      
      // Reset back to idle after 2 seconds
      setTimeout(() => {
        setTaggingState('idle');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-shadow" id="nfc-simulator-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-sans flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            NFC 카드 태깅 시뮬레이터
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">실제 일러스트 전시회장에서 카드를 태그하는 경험을 직접 테스트해보세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-4">
        {/* Step 1: Choose card */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
            1. 작가의 NFC 아트 카드 선택
          </label>
          <div className="space-y-2">
            {artists.map((artist) => {
              const isSelected = selectedArtist.serialNumber === artist.serialNumber;
              return (
                <button
                  key={artist.serialNumber}
                  onClick={() => {
                    if (taggingState === 'idle') setSelectedArtist(artist);
                  }}
                  disabled={taggingState !== 'idle'}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                  id={`select-artist-card-${artist.serialNumber}`}
                >
                  <img
                    src={artist.profileImage}
                    alt={artist.name}
                    className="h-9 w-9 rounded-xl object-cover border border-black/5"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500">{artist.serialNumber}</p>
                    <p className="text-sm font-bold truncate leading-tight mt-0.5">{artist.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Simulated physical tag */}
        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-100 rounded-2xl bg-gray-50/30 min-h-[220px]">
          <AnimatePresence mode="wait">
            {taggingState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col items-center text-center space-y-4 w-full"
              >
                {/* Physical Card Mockup */}
                <motion.div
                  whileHover={{ y: -4, rotate: -1 }}
                  className="relative w-44 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-4 shadow-lg flex flex-col justify-between overflow-hidden border border-white/20"
                >
                  {/* Glossy overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <Wifi className="h-5 w-5 text-white/80 rotate-90" />
                    <span className="text-[10px] font-mono tracking-widest bg-white/20 px-1.5 py-0.5 rounded uppercase font-semibold">NFC ART</span>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/70 font-mono tracking-wider">SERIAL NUMBER</p>
                    <p className="text-sm font-mono font-bold tracking-wider leading-none mt-0.5">{selectedArtist.serialNumber}</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-white/15 pt-1.5">
                    <span className="text-[10px] font-medium truncate max-w-[100px]">{selectedArtist.name.split('(')[0]}</span>
                    <span className="text-[9px] opacity-75 font-mono">BOM & DOYUN & MINJI</span>
                  </div>
                </motion.div>

                <button
                  onClick={handleSimulateTag}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                  id="simulate-tag-action-btn"
                >
                  <Smartphone className="h-4 w-4" />
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
                  <div className="relative h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Smartphone className="h-6 w-6 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 animate-pulse">카드를 태그하는 중...</h4>
                  <p className="text-xs text-gray-500 mt-1">스마트폰 뒷면에 NFC 칩을 대어주세요.</p>
                </div>
              </motion.div>
            )}

            {taggingState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center space-y-3"
              >
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">태깅 성공!</h4>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">[{selectedArtist.name}]</p>
                  <p className="text-xs text-gray-500 mt-1">
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
