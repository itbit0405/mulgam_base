import { motion } from 'motion/react';
import { Smartphone, Download, ShieldCheck, Zap, Heart, BellRing, Sparkles } from 'lucide-react';

export default function AppDownload() {
  const naverPlayStoreUrl = "https://play.google.com/store/apps/details?id=com.nhn.android.search";

  return (
    <div className="py-12 max-w-6xl mx-auto space-y-16" id="app-download-container">
      {/* Introduction Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Text Area */}
        <div className="lg:col-span-7 space-y-6 relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
            <Sparkles className="h-3.5 w-3.5" />
            모바일 전용 공식 애플리케이션
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            내 손안의 작은 갤러리,<br />
            NFC ART LINK 앱을 만나보세요
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
            이제 무거운 도록이나 스케줄러 대신 스마트폰 하나로 전시회를 가볍게 기억하세요. 
            앱 전용 초고속 NFC 스캔 모듈과 지능형 백그라운드 푸시 시스템을 탑재하여, 
            인터넷이 불안정한 전시장 내부에서도 즉시 카드를 연동하고 전시 일정을 예약할 수 있습니다.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 items-start">
            <a
              href={naverPlayStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-100"
              id="google-play-download-anchor"
            >
              <Download className="h-5 w-5" />
              <div className="text-left">
                <p className="text-[10px] opacity-80 leading-none">안드로이드 다운로드</p>
                <p className="text-sm font-extrabold mt-0.5">Google Play</p>
              </div>
            </a>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0 text-xs text-slate-400 pl-1 sm:pt-4">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>안전하고 인증된 공식 앱 스토어로 이동합니다.</span>
            </div>
          </div>
        </div>

        {/* Visual Mockup Area */}
        <div className="lg:col-span-5 flex justify-center relative">
          {/* Simulated Smartphone */}
          <motion.div
            initial={{ y: 30, rotate: 2, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
            className="w-56 h-[400px] bg-slate-950 rounded-[40px] border-[6px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4"
          >
            {/* Camera notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20" />
            
            {/* Screen top */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 px-1 z-10">
              <span>NFC LINK</span>
              <span>10:04 AM</span>
            </div>

            {/* Core Mock Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center px-2 py-4 space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center shadow-lg">
                <Smartphone className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">NFC ART LINK</h4>
                <p className="text-[10px] text-slate-400">일러스트 컬렉터를 위한 홈</p>
              </div>
              <div className="w-full bg-slate-900/80 rounded-xl p-2.5 border border-white/5 space-y-1 text-left">
                <div className="flex items-center justify-between text-[9px] text-emerald-400 font-semibold">
                  <span>● 태깅 인식 성공</span>
                  <span>ART-1004</span>
                </div>
                <p className="text-[11px] font-bold text-white truncate leading-tight">일러스트레이터 봄(BOM)</p>
                <p className="text-[9px] text-slate-400 truncate">관심 작가 목록에 추가되었습니다.</p>
              </div>
            </div>

            {/* Screen bottom */}
            <div className="h-1 w-24 bg-white/40 rounded-full mx-auto mb-1" />
          </motion.div>

          {/* Decorative floating badges */}
          <div className="absolute top-1/4 -left-6 bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-xs flex items-center gap-2 shadow-xl">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>0.1초 빠른 연동</span>
          </div>
          
          <div className="absolute bottom-1/4 -right-6 bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-xs flex items-center gap-2 shadow-xl">
            <BellRing className="h-4 w-4 text-emerald-400" />
            <span>실시간 알림 피드</span>
          </div>
        </div>
      </div>

      {/* Feature Breakdown Grid */}
      <div className="space-y-10">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="text-2xl font-extrabold text-gray-950 font-sans">앱에서 누리는 전용 기능</h3>
          <p className="text-sm text-gray-500 mt-1.5">모바일 전용으로 최적화된 코어 기술을 제공합니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-gray-200/80 bg-white shadow-sm space-y-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-900">지연 없는 초고속 태깅 모듈</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                자체 초저지연 스캔 라이브러리를 통해 앱이 켜진 상태라면 주머니 속에서도 0.1초 만에 스마트 태깅을 실행하고 구독을 마칩니다.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-gray-200/80 bg-white shadow-sm space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-900">안정적인 오프라인 알림 수신</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                인터넷 음영 구역이 많은 지하 전시장이나 번잡한 아트 페어 안에서도 백그라운드 푸시 엔진이 알림을 안전하게 보존하여 최우선 전달합니다.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-gray-200/80 bg-white shadow-sm space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-900">고유 일련번호 암호화 저장</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                부정 태깅 및 일련번호 도용을 사전에 방지하기 위한 엔드투엔드 암호화 키 페어가 장치 로컬 세큐어 엘리먼트에 안전하게 박제됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
