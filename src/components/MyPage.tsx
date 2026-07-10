import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, BadgeCheck, Edit3, Check, Link, Instagram, 
  Upload, Trash2, Users, Heart, Sparkles, Send, 
  FileImage, Video, Bell, Calendar, ChevronRight, HelpCircle,
  Smartphone, Wifi, CheckCircle2, X, RefreshCw
} from 'lucide-react';
import { User, ArtistMock, ExhibitionNotification } from '../types';
import { MOCK_ARTISTS, MOCK_USER_FANS } from '../data';

interface MyPageProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  notifications: ExhibitionNotification[];
  onAddNotification: (notification: ExhibitionNotification) => void;
  artists?: ArtistMock[];
}

export default function MyPage({ currentUser, onUpdateUser, notifications, onAddNotification, artists = MOCK_ARTISTS }: MyPageProps) {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(currentUser.nickname);
  const [isApplyingArtist, setIsApplyingArtist] = useState(false);
  
  // NFC Tagging Simulator Modal state for users
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
  const [nfcTaggingState, setNfcTaggingState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [selectedNfcArtist, setSelectedNfcArtist] = useState<ArtistMock>(artists[0] || MOCK_ARTISTS[0]);
  const [justLinkedArtist, setJustLinkedArtist] = useState<ArtistMock | null>(null);

  // Artist Application Form state
  const [instagramInput, setInstagramInput] = useState('');
  const [webpageInput, setWebpageInput] = useState('');
  const [appFiles, setAppFiles] = useState<{ name: string; url: string; type: 'image' | 'video' }[]>([]);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Artist Serial Number editing
  const [isEditingSerial, setIsEditingSerial] = useState(false);
  const [serialInput, setSerialInput] = useState(currentUser.serialNumber || 'ART-7777');

  // Broadcast Exhibition form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const artistPicRef = useRef<HTMLInputElement>(null);
  const artistVideoRef = useRef<HTMLInputElement>(null);

  // Check for auto NFC action on login and handle pending tags
  useEffect(() => {
    const openNfcOnLogin = localStorage.getItem('open_nfc_on_login');
    if (openNfcOnLogin === 'true') {
      setIsNfcModalOpen(true);
      localStorage.removeItem('open_nfc_on_login');
    }

    const justLinkedTag = sessionStorage.getItem('nfc_just_linked_tag');
    if (justLinkedTag) {
      const artist = artists.find(a => a.serialNumber === justLinkedTag);
      if (artist) {
        setJustLinkedArtist(artist);
        setNfcTaggingState('success');
        setIsNfcModalOpen(true);
      }
      sessionStorage.removeItem('nfc_just_linked_tag');
    }
  }, []);

  const triggerNfcSimulation = () => {
    setNfcTaggingState('scanning');
    setJustLinkedArtist(null);
    
    setTimeout(() => {
      // Add favorite artist if not already there
      if (!currentUser.favoriteArtists.includes(selectedNfcArtist.serialNumber)) {
        onUpdateUser({
          ...currentUser,
          favoriteArtists: [...currentUser.favoriteArtists, selectedNfcArtist.serialNumber]
        });
      }
      setJustLinkedArtist(selectedNfcArtist);
      setNfcTaggingState('success');
    }, 1500);
  };

  // 1. Profile Photo Change
  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdateUser({
            ...currentUser,
            profileImage: reader.result
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Nickname Change
  const saveNickname = () => {
    if (newNickname.trim()) {
      onUpdateUser({
        ...currentUser,
        nickname: newNickname.trim()
      });
      setIsEditingNickname(false);
    }
  };

  // 3. Artist Serial Number Update
  const saveSerialNumber = () => {
    if (serialInput.trim()) {
      onUpdateUser({
        ...currentUser,
        serialNumber: serialInput.trim()
      });
      setIsEditingSerial(false);
    }
  };

  // 4. Handle Mock File Upload for Artist Application
  const handleAppFileUpload = (e: ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    const files = e.target.files;
    if (files) {
      const updatedFiles = [...appFiles];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fakeUrl = URL.createObjectURL(file);
        updatedFiles.push({
          name: file.name,
          url: fakeUrl,
          type: fileType
        });
      }
      setAppFiles(updatedFiles);
    }
  };

  const removeAppFile = (index: number) => {
    const updated = appFiles.filter((_, i) => i !== index);
    setAppFiles(updated);
  };

  // 5. Submit Artist Application -> Set to artist_pending so the admin can approve!
  const handleArtistSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingApp(true);

    setTimeout(() => {
      onUpdateUser({
        ...currentUser,
        role: 'artist_pending',
        instagramUrl: instagramInput || 'https://instagram.com/my_drawings',
        webpageUrl: webpageInput || 'https://myportfolio.com',
        uploadedFiles: appFiles,
        description: 'NFC 카드로 독자들과 소통하고 소식을 보낼 정식 승인 일러스트레이터 지망 작가입니다.'
      });
      setIsSubmittingApp(false);
      setIsApplyingArtist(false);
      // reset form
      setInstagramInput('');
      setWebpageInput('');
      setAppFiles([]);
    }, 1500);
  };

  // 6. Handle Unfavoriting an Artist
  const handleUnfavoriteArtist = (serialNumber: string) => {
    const filtered = currentUser.favoriteArtists.filter(s => s !== serialNumber);
    onUpdateUser({
      ...currentUser,
      favoriteArtists: filtered
    });
  };

  // 7. Broadcast exhibition notification
  const handleBroadcast = (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;

    setIsBroadcasting(true);

    setTimeout(() => {
      const newNotification: ExhibitionNotification = {
        id: `noti-${Date.now()}`,
        artistName: currentUser.nickname,
        artistSerialNumber: currentUser.serialNumber || 'ART-UNKNOWN',
        title: broadcastTitle,
        content: broadcastContent,
        date: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };

      onAddNotification(newNotification);
      setIsBroadcasting(false);
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastContent('');

      setTimeout(() => {
        setBroadcastSuccess(false);
      }, 3000);
    }, 1200);
  };

  // Helper to resolve favorite artist objects from their serial numbers
  const favoritedArtistObjects = artists.filter(artist => 
    currentUser.favoriteArtists.includes(artist.serialNumber)
  );

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-10" id="mypage-component-container">
      {/* 1. Header Profile Banner */}
      <div className="rounded-3xl border border-gray-200/80 bg-white/75 backdrop-blur-md p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        {/* Glow behind profile */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-br-full pointer-events-none" />

        {/* Profile Avatar with file uploader trigger */}
        <div className="relative group cursor-pointer" id="mypage-avatar-section">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-white shadow-md overflow-hidden relative bg-gray-100">
            <img
              src={currentUser.profileImage}
              alt={currentUser.nickname}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Hover Camera overlay */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 p-1.5 rounded-full bg-white text-gray-700 shadow border border-gray-200 hover:bg-gray-50 active:scale-95"
            title="프로필 사진 업로드"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
            className="hidden"
            id="profile-image-upload-input"
          />
        </div>

        {/* User basic stats and status */}
        <div className="flex-1 text-center sm:text-left space-y-3 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
            {isEditingNickname ? (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="px-3 py-1 text-base font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={15}
                  id="nickname-edit-input"
                />
                <button
                  onClick={saveNickname}
                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight" id="mypage-nickname-display">
                  {currentUser.nickname}
                </h2>
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="p-1 rounded text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  title="닉네임 변경"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Verification Status */}
            {currentUser.role === 'artist' ? (
              <div className="artist-badge px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm text-indigo-800 tracking-wide font-bold text-xs mx-auto sm:mx-0 w-fit">
                <BadgeCheck className="h-4 w-4 text-indigo-600" />
                인증된 작가입니다
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-50 text-slate-500 text-xs font-semibold border border-slate-200 mx-auto sm:mx-0 w-fit">
                일반 컬렉터 계정
              </div>
            )}
          </div>

          {/* Serial number for Artists - Read Only */}
          {currentUser.role === 'artist' && (
            <div className="flex flex-col sm:flex-row items-center gap-1.5 justify-center sm:justify-start text-xs text-gray-500 font-mono">
              <span className="font-semibold text-gray-400">할당된 작가 일련번호:</span>
              <span className="font-bold text-indigo-600 bg-indigo-50/50 px-2.5 py-0.5 rounded border border-indigo-100/40" id="artist-serial-display">
                {currentUser.serialNumber || 'ART-9912'}
              </span>
            </div>
          )}

          {/* Core Info */}
          <p className="text-xs text-gray-400 font-sans" id="mypage-email-display">
            연동된 계정: {currentUser.email} | 카카오 간편 연동 상태
          </p>
        </div>
      </div>

      {/* 2. Primary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {currentUser.role === 'artist' ? (
          <>
            {/* LEFT / ABOVE COLUMN: Broadcast Exhibition Notifications (7 cols) */}
            <div className="lg:col-span-7 space-y-8" id="artist-broadcast-panel">
              <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6" id="artist-broadcaster-box">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-950 font-sans flex items-center gap-2">
                    <Send className="h-5 w-5 text-emerald-500" />
                    전시회 및 소식 일괄 알림 전송
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">나를 수집해 간 관심 사용자들에게 스마트폰 푸시 알림과 알림장을 즉시 전송합니다.</p>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500">알림 제목</label>
                    <input
                      type="text"
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="예) [서울] 하진 작가 특별 기획전 - '여름날의 숲' 초대장"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-sans"
                      id="broadcast-title-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500">알림 상세 내용</label>
                    <textarea
                      required
                      rows={4}
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      placeholder="전시회 장소, 일정, 사전 티켓 예약 방법 등 팬들에게 전달하고 싶은 자세한 핵심 내용을 적어주세요."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-sans resize-none"
                      id="broadcast-content-textarea"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      <span>나를 추가한 팬 {currentUser.fanUsers?.length || 0}명에게 다이렉트 전송</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 active:scale-95"
                      id="broadcast-submit-btn"
                    >
                      {isBroadcasting ? (
                        <span>전송 중...</span>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>전시회 소식 전송하기</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <AnimatePresence>
                  {broadcastSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-xs font-semibold text-center"
                    >
                      🎉 성공적으로 다이렉트 전시회 푸시 알림을 발송하였습니다!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT / BELOW COLUMN: Users Who Registered Me / Fan List (5 cols) */}
            <div className="lg:col-span-5 space-y-8" id="artist-fans-panel">
              <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6" id="artist-fans-list-box">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold text-gray-950 font-sans flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500 shrink-0" />
                        나를 등록한 사용자
                      </h3>
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100 shrink-0" id="artist-fans-count-badge">
                        {currentUser.fanUsers?.length || 0}명
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">실물 NFC 카드를 수집한 팬 목록입니다.</p>
                  </div>
                </div>

                {(!currentUser.fanUsers || currentUser.fanUsers.length === 0) ? (
                  <div className="text-center py-12 px-4 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-500">아직 나를 등록한 사용자가 없습니다.</p>
                    <p className="text-xs text-gray-400 mt-1">홍보 카드를 전시회장에 비치하여 NFC 태깅을 유도해 보세요!</p>
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto pr-1.5 space-y-3" id="artist-fan-grid-scroll-wrapper">
                    <div className="grid grid-cols-1 gap-3" id="artist-fan-grid">
                      {currentUser.fanUsers.map((fan, index) => (
                        <div 
                          key={`${fan.id}-${index}`}
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-indigo-50/30 hover:border-indigo-100/50 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500 flex items-center justify-center font-bold text-xs border border-indigo-100/30">
                            {fan.nickname.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {fan.nickname} <span className="text-xs font-normal text-gray-400 font-mono ml-1">({fan.id})</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-sans mt-0.5">NFC 수집일: 2026.07.09</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Left Column (8 cols): Main Lists & Applications */}
            <div className={`lg:col-span-8 space-y-8 ${currentUser.role === 'user' ? 'order-2 lg:order-1' : ''}`}>
              
              {/* USER SPECIFIC: Interest Artist List */}
              {currentUser.role === 'user' && (
                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6" id="regular-user-fav-list-box">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-950 font-sans flex items-center gap-2">
                        <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                        관심 작가 리스트
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">내가 NFC 카드를 태깅하여 수집한 작가 리스트입니다.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setNfcTaggingState('idle');
                          setJustLinkedArtist(null);
                          setIsNfcModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                        id="trigger-mypage-nfc-modal-btn"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        실물 NFC 카드 태깅하기
                      </button>
                      <span className="text-xs font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full border border-rose-100" id="fav-count-badge">
                        관심 작가 ({currentUser.favoriteArtists.length}명)
                      </span>
                    </div>
                  </div>

                  {favoritedArtistObjects.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col items-center">
                      <Heart className="h-8 w-8 text-gray-300 mb-3" />
                      <p className="text-sm font-semibold text-gray-500">아직 등록된 관심 작가가 없습니다.</p>
                      <p className="text-xs text-gray-400 mt-1 mb-5">아래 버튼을 눌러 소장하신 실물 카드의 NFC 태깅을 테스트해 보세요!</p>
                      <button
                        onClick={() => {
                          setNfcTaggingState('idle');
                          setJustLinkedArtist(null);
                          setIsNfcModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition-all active:scale-[0.98]"
                      >
                        <Smartphone className="h-4 w-4" />
                        실물 NFC 카드 태깅 시뮬레이션
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoritedArtistObjects.map((artist) => (
                        <div 
                          key={artist.serialNumber}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-50 bg-gray-50/30 hover:bg-gray-50/60 transition-colors gap-4"
                          id={`favorite-artist-item-${artist.serialNumber}`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={artist.profileImage}
                              alt={artist.name}
                              className="h-12 w-12 rounded-xl object-cover border border-black/5"
                              referrerPolicy="no-referrer"
                            />
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-gray-900 text-sm">
                                {artist.name} <span className="text-xs font-mono font-medium text-indigo-600 ml-1">({artist.serialNumber})</span>
                              </h4>
                              <p className="text-xs text-gray-500 font-sans line-clamp-1">{artist.description}</p>
                              {artist.recentExhibitions.length > 0 && (
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>전시 중: {artist.recentExhibitions[0].title}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <a 
                              href={artist.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50/20 transition-colors"
                              title="인스타그램 방문"
                            >
                              <Instagram className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleUnfavoriteArtist(artist.serialNumber)}
                              className="px-3 py-1.5 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 rounded-xl text-xs font-semibold transition-colors"
                            >
                              관심 해제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

          {/* USER SPECIFIC: Request Artist Verification Form OR Pending status */}
          {(currentUser.role === 'user' || currentUser.role === 'artist_pending') && (
            <div id="artist-application-wrapper">
              {currentUser.role === 'artist_pending' ? (
                <div className="rounded-3xl border border-yellow-200 bg-yellow-50/30 p-6 sm:p-8 shadow-sm space-y-4" id="artist-pending-section">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-gray-900 font-sans">작가 심사 승인 대기 중</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        작성해주신 포트폴리오 자료와 인스타그램 링크를 바탕으로 관리자가 꼼꼼히 검토 중입니다. 승인이 완료되면 고유 일련번호 발급 알림과 함께 즉시 작가 전용 관리 대시보드로 업그레이드됩니다.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-4 rounded-xl border border-yellow-100 text-xs space-y-2">
                    <div className="flex items-center justify-between text-gray-500 font-semibold">
                      <span>신청 계정</span>
                      <span className="text-gray-900">{currentUser.nickname} ({currentUser.email})</span>
                    </div>
                    {currentUser.instagramUrl && (
                      <div className="flex items-center justify-between text-gray-500 font-semibold">
                        <span>제출된 인스타그램</span>
                        <span className="text-gray-900">{currentUser.instagramUrl}</span>
                      </div>
                    )}
                    {currentUser.webpageUrl && (
                      <div className="flex items-center justify-between text-gray-500 font-semibold">
                        <span>제출된 포트폴리오</span>
                        <span className="text-gray-900">{currentUser.webpageUrl}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-yellow-100/60 text-[11px] text-gray-400">
                    <span>💡 상단의 <strong>관리자 모드</strong> 또는 우측 하단의 <strong>State Switcher (최고 관리자)</strong>를 사용하여 관리자 전용 대시보드에서 본 계정을 즉시 승인해 보세요!</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6" id="artist-request-section">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-950 font-sans flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        작가 계정 신청
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">일러스트 작가이신가요? 인증받고 내 전용 일련번호가 달린 NFC 카드를 발급하세요.</p>
                    </div>
                    {!isApplyingArtist && (
                      <button
                        onClick={() => setIsApplyingArtist(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-center"
                        id="apply-artist-open-btn"
                      >
                        작가 승인 신청서 작성
                      </button>
                    )}
                  </div>

                  {isApplyingArtist ? (
                    <form onSubmit={handleArtistSubmit} className="space-y-5" id="artist-apply-form">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Instagram */}
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-500">인스타그램 URL</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                              <Instagram className="h-4 w-4" />
                            </span>
                            <input
                              type="url"
                              required
                              value={instagramInput}
                              onChange={(e) => setInstagramInput(e.target.value)}
                              placeholder="https://instagram.com/my_work"
                              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                              id="instagram-url-input"
                            />
                          </div>
                        </div>

                        {/* Personal Website */}
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-500">개인 웹페이지 또는 포트폴리오 URL</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                              <Link className="h-4 w-4" />
                            </span>
                            <input
                              type="url"
                              required
                              value={webpageInput}
                              onChange={(e) => setWebpageInput(e.target.value)}
                              placeholder="https://myportfolio.com"
                              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                              id="webpage-url-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Portfolio Image & Video Upload */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500">인증을 위한 그림 일러스트 및 작업 동영상 파일 업로드</label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Image Dropzone */}
                          <div 
                            onClick={() => artistPicRef.current?.click()}
                            className="p-5 border border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/25 hover:bg-indigo-50/10 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
                          >
                            <FileImage className="h-6 w-6 text-indigo-500" />
                            <div>
                              <p className="text-xs font-bold text-gray-700">그림 일러스트 이미지 추가</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG 파일 선택</p>
                            </div>
                            <input
                              ref={artistPicRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleAppFileUpload(e, 'image')}
                              className="hidden"
                            />
                          </div>

                          {/* Video Dropzone */}
                          <div 
                            onClick={() => artistVideoRef.current?.click()}
                            className="p-5 border border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/25 hover:bg-indigo-50/10 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
                          >
                            <Video className="h-6 w-6 text-purple-500" />
                            <div>
                              <p className="text-xs font-bold text-gray-700">작업 과정 동영상 추가</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">MP4, MOV 파일 선택</p>
                            </div>
                            <input
                              ref={artistVideoRef}
                              type="file"
                              accept="video/*"
                              multiple
                              onChange={(e) => handleAppFileUpload(e, 'video')}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Uploaded Files Shelf */}
                      {appFiles.length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">선택된 업로드 파일 목록 ({appFiles.length})</p>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {appFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 text-xs">
                                <div className="flex items-center gap-2 truncate pr-4">
                                  {file.type === 'image' ? <FileImage className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" /> : <Video className="h-4.5 w-4.5 text-purple-500 flex-shrink-0" />}
                                  <span className="font-medium text-gray-700 truncate">{file.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAppFile(idx)}
                                  className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submission and Control Bar */}
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setIsApplyingArtist(false)}
                          className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingApp}
                          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                          id="artist-application-submit-btn"
                        >
                          {isSubmittingApp ? (
                            <span>심사 신청 중...</span>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>작가 인증 신청 완료</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed font-sans">
                        <span className="font-bold text-gray-700">무엇이 승인되나요?</span> 작가로 인증되면 고유한 일련번호가 발급되며, 해당 고유번호가 탑재된 본인만의 실물 NFC 카드를 발급 요청하실 수 있습니다. 또한 나를 등록한 일반 사용자들을 전용 게시판에서 실시간으로 관찰하고, 스마트 알림 푸시를 다이렉트로 전송해 전시 정보를 즉시 제공할 수 있습니다.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column (4 cols): Sidebars, Information, and Notifications Tray */}

        {/* NFC Tagging Simulation Modal */}
        <AnimatePresence>
          {isNfcModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNfcModalOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              />

              {/* Modal Content */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl z-10 border border-gray-100"
                id="mypage-nfc-modal-box"
              >
                {/* Close button */}
                <button
                  onClick={() => setIsNfcModalOpen(false)}
                  className="absolute top-5 right-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  id="close-nfc-modal-btn"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 tracking-tight font-sans">
                    실물 NFC 카드 태깅 시뮬레이션
                  </h3>
                  <p className="mt-1.5 text-xs text-gray-400 font-sans">
                    스마트폰 뒷면에 실물 NFC 카드를 대어 연동을 완료하는 과정입니다.
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {nfcTaggingState === 'idle' && (
                    <motion.div
                      key="nfc-idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-5"
                    >
                      {/* 1. Select card */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          1. 태깅할 아티스트의 실물 카드 선택
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {artists.map((artist) => {
                            const isSelected = selectedNfcArtist.serialNumber === artist.serialNumber;
                            return (
                              <button
                                key={artist.serialNumber}
                                type="button"
                                onClick={() => setSelectedNfcArtist(artist)}
                                className={`flex flex-col items-center p-3 rounded-2xl text-center border transition-all ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-bold'
                                    : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                }`}
                              >
                                <img
                                  src={artist.profileImage}
                                  alt={artist.name}
                                  className="h-10 w-10 rounded-xl object-cover border border-black/5 mb-1.5"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[10px] font-mono tracking-wider font-semibold opacity-75">{artist.serialNumber}</span>
                                <span className="text-xs truncate max-w-[100px] mt-0.5 leading-tight font-bold">{artist.name.split('(')[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Visual Card display & Action */}
                      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-100 rounded-2xl bg-gray-50/40 space-y-4">
                        <motion.div
                          whileHover={{ y: -3, rotate: -1 }}
                          className="relative w-44 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-4 shadow-lg flex flex-col justify-between overflow-hidden border border-white/20"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                          <div className="flex justify-between items-start">
                            <Wifi className="h-5 w-5 text-white/80 rotate-90" />
                            <span className="text-[9px] font-mono tracking-widest bg-white/20 px-1.5 py-0.5 rounded uppercase font-semibold">NFC ART</span>
                          </div>
                          <div>
                            <p className="text-[8px] text-white/70 font-mono tracking-wider leading-none">SERIAL NO</p>
                            <p className="text-sm font-mono font-bold tracking-wider leading-none mt-1">{selectedNfcArtist.serialNumber}</p>
                          </div>
                          <div className="flex justify-between items-end border-t border-white/15 pt-1.5">
                            <span className="text-[10px] font-medium truncate max-w-[110px]">{selectedNfcArtist.name.split('(')[0]}</span>
                            <span className="text-[8px] opacity-75 font-mono">NFC ART LINK</span>
                          </div>
                        </motion.div>

                        <button
                          type="button"
                          onClick={triggerNfcSimulation}
                          className="flex items-center justify-center gap-2 w-full max-w-xs py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                        >
                          <Smartphone className="h-4 w-4" />
                          스마트폰 NFC 카드 태그 완료하기
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {nfcTaggingState === 'scanning' && (
                    <motion.div
                      key="nfc-scanning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-10 space-y-4 text-center"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-75" />
                        <div className="relative h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                          <Smartphone className="h-7 w-7 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">카드를 인식하는 중...</h4>
                        <p className="text-xs text-gray-400 mt-1">NTAG Secure 칩을 분석하고 있습니다. 잠시만 기다려주세요.</p>
                      </div>
                    </motion.div>
                  )}

                  {nfcTaggingState === 'success' && justLinkedArtist && (
                    <motion.div
                      key="nfc-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-4 space-y-5 text-center"
                    >
                      <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-gray-900">NFC 태깅 연동 성공!</h4>
                        <p className="text-xs text-gray-500 font-sans">회원님의 관심 작가 목록에 안전하게 등록되었습니다.</p>
                      </div>

                      {/* Profile card design */}
                      <div className="flex items-center gap-3 p-4 bg-emerald-50/20 border border-emerald-100/40 rounded-2xl w-full max-w-sm text-left">
                        <img
                          src={justLinkedArtist.profileImage}
                          alt={justLinkedArtist.name}
                          className="h-12 w-12 rounded-xl object-cover border border-black/5"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {justLinkedArtist.serialNumber}
                          </span>
                          <h5 className="font-bold text-gray-900 text-sm mt-1">{justLinkedArtist.name}</h5>
                          <p className="text-[11px] text-gray-500 font-sans mt-0.5 line-clamp-1">{justLinkedArtist.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNfcTaggingState('idle');
                            setJustLinkedArtist(null);
                          }}
                          className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                          추가 태깅하기
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNfcModalOpen(false)}
                          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          관심 목록 확인하기
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <div className={`lg:col-span-4 space-y-8 ${currentUser.role === 'user' ? 'order-1 lg:order-2' : ''}`}>
          
           {/* Global/Simulated Notifications Tray for Users */}
           {currentUser.role === 'user' && (
             <div className="glass-panel p-6 shadow-xl space-y-5" id="user-notifications-tray">
               <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                 <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                   <Bell className="h-4.5 w-4.5 text-indigo-500" />
                   수신된 전시회 소식
                 </h4>
                 <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                   {notifications.length}건
                 </span>
               </div>
   
               {notifications.length === 0 ? (
                 <div className="text-center py-8 text-gray-400">
                   <Bell className="h-6 w-6 mx-auto text-gray-200 mb-2" />
                   <p className="text-xs">수신된 다이렉트 소식이 없습니다.</p>
                   <p className="text-[10px] text-gray-400 mt-1">내가 관심 등록한 작가가 소식을 발송하면 푸시 알림이 보관됩니다.</p>
                 </div>
               ) : (
                 <div className="space-y-3 max-h-[380px] overflow-y-auto list-scroll pr-1">
                   {notifications.map((noti) => (
                     <div 
                       key={noti.id}
                       className="p-3 bg-white/90 border border-gray-100 shadow-sm rounded-xl space-y-1.5 relative overflow-hidden"
                     >
                       <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500/20" />
                       <div className="flex justify-between items-start">
                         <span className="text-[10px] font-bold text-indigo-600 truncate max-w-[140px]">
                           {noti.artistName} ({noti.artistSerialNumber})
                         </span>
                         <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">{noti.date}</span>
                       </div>
                       <h5 className="font-bold text-gray-900 text-xs leading-snug">{noti.title}</h5>
                       <p className="text-[11px] text-gray-500 leading-normal font-sans whitespace-pre-line">{noti.content}</p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
 


        </div>
      </>
    )}

      </div>
    </div>
  );
}
