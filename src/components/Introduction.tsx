import { motion } from 'motion/react';
import { Smartphone, Bell, Heart, CreditCard, Sparkles, Send, Compass, HelpCircle } from 'lucide-react';
import { User, ArtistMock } from '../types';
import NfcTagSimulator from './NfcTagSimulator';

interface IntroductionProps {
  currentUser: User | null;
  onAddArtist: (serialNumber: string) => void;
  onOpenLogin: () => void;
  onNavigateToMypage: () => void;
  artists?: ArtistMock[];
}

export default function Introduction({ currentUser, onAddArtist, onOpenLogin, onNavigateToMypage, artists }: IntroductionProps) {
  return (
    <div className="space-y-16 py-8" id="intro-section-container">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100"
        >
          <Sparkles className="h-3.5 w-3.5" />
          예술과 기술의 소통적 만남
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight"
        >
          손끝으로 수집하는 아티스트,<br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
            커스텀 NFC 아트 카드
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 font-sans font-medium"
        >
          일러스트 전시회장의 수많은 감동, 잊혀지는 종이 리플렛 대신<br className="hidden md:inline" />
          작가의 고유 일련번호가 탑재된 영구적인 미니 마스터피스를 소장해 보세요.
        </motion.p>

        {currentUser ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <button
              onClick={onNavigateToMypage}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              마이페이지 바로가기
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <button
              onClick={onOpenLogin}
              className="px-6 py-3 bg-gray-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              카카오로 3초 만에 로그인하기
            </button>
          </motion.div>
        )}
      </div>

      {/* Visual Core Concept - Dual Loop Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Card: Regular User Perspective */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl border border-gray-200/80 bg-white p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          id="user-perspective-intro-box"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">일반 사용자를 위한 특별한 가치</h2>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed font-sans">
                전시회장이나 온/오프라인에서 획득한 작가의 NFC 카드를 스마트폰 뒤에 대는 것만으로 번거로운 검색이나 가입 절차 없이 내 관심 목록에 소중한 작가를 간편히 구독할 수 있습니다.
              </p>
            </div>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 mt-0.5">1</span>
                <span className="text-sm text-gray-700">작가의 고유 일련번호가 담긴 아름다운 한정판 NFC 카드 소장</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 mt-0.5">2</span>
                <span className="text-sm text-gray-700">스마트폰 터치 한번으로 손쉽게 관심 작가 등록 및 구독 처리</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 mt-0.5">3</span>
                <span className="text-sm text-gray-700">관심 작가의 다가오는 전시회 일정, 특별전 및 실시간 알림 수신</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Right Card: Artist Perspective */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl border border-gray-200/80 bg-white p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          id="artist-perspective-intro-box"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">작가를 위한 효율적인 팬덤 빌더</h2>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed font-sans">
                복잡한 SNS 마케팅에 지쳤다면 나를 온전히 수집한 '진짜 팬'들에게 다가가세요. 나를 관심 작가로 등록한 충성 고객들에게 다가오는 새 전시회 정보와 비하인드 소식을 실시간 알림으로 즉각 전송해 보세요.
              </p>
            </div>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 mt-0.5">1</span>
                <span className="text-sm text-gray-700">내 작품이 담긴 실물 NFC 굿즈 카드에 내 고유 일련번호 할당</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 mt-0.5">2</span>
                <span className="text-sm text-gray-700">나를 등록한 관심 독자 및 팬 리스트를 투명하게 실시간 파악</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 mt-0.5">3</span>
                <span className="text-sm text-gray-700">다가오는 전시회 일정, 티켓 예매 정보 등 모바일 맞춤 푸시 일괄 발송</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Embedded NFC Interactive Simulator */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-950 font-sans">지금 직접 태그해 보세요</h2>
          <p className="text-sm text-gray-500 mt-2 font-sans font-medium">
            실제 태깅 시나리오가 어떻게 작동하는지 체험해 보실 수 있습니다.<br />
            태깅하면 나의 관심 작가 리스트에 즉시 축적됩니다.
          </p>
        </div>
        <NfcTagSimulator
          currentUser={currentUser}
          onAddArtist={onAddArtist}
          onOpenLogin={onOpenLogin}
          artists={artists}
        />
      </div>

      {/* How It Works - Step-by-Step */}
      <div className="space-y-10">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 font-sans">연결 프로세스</h2>
          <p className="text-sm text-gray-500 mt-1">NFC 아트 링크가 완성하는 단 3단계 소통 서클</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-lg font-mono">
              01
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-base">한정판 실물 카드 획득</h4>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                전시회장 웰컴 팩 또는 작가 마켓에서 고유 일련번호가 정밀 인코딩된 프리미엄 실물 카드를 획득합니다.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg font-mono">
              02
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-base">간편 모바일 태깅</h4>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                앱 다운로드 후 회원가입을 마치고 카드를 스마트폰 뒷면에 밀착하면, 자동으로 작가가 내 서재에 구독 연동됩니다.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg font-mono">
              03
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-base">실시간 캘린더 & 소식</h4>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                작가가 직접 구성하여 송신하는 전시 일정, 작업실 비공개 비하인드 컷, 사전 예약 소식을 단독 푸시로 받습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
