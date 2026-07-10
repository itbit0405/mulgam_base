import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Heart, Bell, Smartphone, Compass, 
  HelpCircle, Info, ChevronRight, Download, RefreshCw 
} from 'lucide-react';

import { User, ExhibitionNotification, ArtistMock } from './types';
import Navbar from './components/Navbar';
import Introduction from './components/Introduction';
import AppDownload from './components/AppDownload';
import MyPage from './components/MyPage';
import AdminPage from './components/AdminPage';
import KakaoLoginModal from './components/KakaoLoginModal';
import StateController from './components/StateController';
import { INITIAL_ALL_USERS, MOCK_ARTISTS } from './data';
import { isSupabaseConfigured, upsertProfile, getProfileByKakaoId } from './supabaseClient';

const INITIAL_NOTIFICATIONS: ExhibitionNotification[] = [
  {
    id: 'noti-seed-1',
    artistName: '일러스트레이터 봄(BOM)',
    artistSerialNumber: 'ART-1004',
    title: '🌿 [초대] 개인전 《초록빛 머무는 방》 개최 소식',
    content: '안녕하세요, 컬렉터님! 봄 작가입니다.\n다가오는 8월 1일부터 15일까지 인사동 갤러리 그리다에서 저의 첫 개인전이 개최됩니다.\n\n실물 NFC 카드를 태깅해 주신 관심 독자님들을 위해 오프라인 방문 시 무료 굿즈 엽서를 증정하는 이벤트를 기획했으니 많은 방문 부탁드립니다! 감사합니 봄.',
    date: '7월 9일 22:04'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [artists, setArtists] = useState<ArtistMock[]>(MOCK_ARTISTS);
  const [activeTab, setActiveTab] = useState<'intro' | 'download' | 'mypage' | 'admin'>('intro');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<ExhibitionNotification[]>(INITIAL_NOTIFICATIONS);
  const [pendingNfcTag, setPendingNfcTag] = useState<string | null>(null);
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Handle client-side OAuth callback (e.g. on Vercel at /oauth or locally/container at /auth/callback)
  useEffect(() => {
    const isOauthPath = window.location.pathname.includes('/oauth') || window.location.pathname.includes('/auth/callback');
    if (!isOauthPath) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return;

    const processOauth = async () => {
      setOauthProcessing(true);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || (
          window.location.origin.includes('vercel.app')
            ? 'https://ais-pre-tnsbfut3hefguantpepxav-541849461180.asia-northeast1.run.app'
            : window.location.origin
        );

        const redirectUri = window.location.origin.includes('vercel.app')
          ? `${window.location.origin}/oauth`
          : `${window.location.origin}/auth/callback`;

        console.log('Processing Kakao OAuth callback. Code:', code, 'Redirect URI:', redirectUri);

        let loggedInUser: User | null = null;

        // Perform client-side token exchange on Vercel to completely avoid CORS issues with the private backend
        const isVercel = window.location.origin.includes('vercel.app');
        if (isVercel) {
          try {
            console.log('Vercel environment detected. Initiating client-side Kakao OAuth exchange...');
            const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: 'bec6867f03cfcf7a7b0b8adeb8376f98',
                redirect_uri: redirectUri,
                code: code,
              }),
            });

            if (!tokenResponse.ok) {
              const errText = await tokenResponse.text();
              throw new Error(`Token exchange failed: ${errText}`);
            }

            const tokenData = await tokenResponse.json() as any;
            const accessToken = tokenData.access_token;

            console.log('Retrieving Kakao user profile on client side...');
            const profileResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (!profileResponse.ok) {
              const errText = await profileResponse.text();
              throw new Error(`User profile fetch failed: ${errText}`);
            }

            const profileData = await profileResponse.json() as any;

            loggedInUser = {
              id: `kakao-${profileData.id}`,
              nickname: profileData.properties?.nickname || profileData.kakao_account?.profile?.nickname || '카카오 사용자',
              profileImage: profileData.properties?.profile_image || profileData.kakao_account?.profile?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              email: profileData.kakao_account?.email || `${profileData.id}@kakao.com`,
              role: 'user',
              favoriteArtists: [],
              fanUsers: []
            };
            console.log('Client-side login successful:', loggedInUser);
          } catch (clientErr) {
            console.error('Client-side exchange failed, falling back to backend:', clientErr);
          }
        }

        // If client-side exchange didn't run or failed, fallback to backend exchange
        if (!loggedInUser) {
          console.log('Attempting backend OAuth exchange...', backendUrl);
          const res = await fetch(`${backendUrl}/api/auth/kakao/exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, redirectUri }),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.details || errData.error || '토큰 교환 실패');
          }

          const data = await res.json();
          if (data.success && data.user) {
            loggedInUser = data.user;
          }
        }
          
        if (loggedInUser) {
          // Save locally
          localStorage.setItem('nfc_platform_user', JSON.stringify(loggedInUser));
          
          // Upsert user profile into Supabase on successful authentication
          if (isSupabaseConfigured) {
            try {
              await upsertProfile({
                kakao_id: loggedInUser.id,
                nickname: loggedInUser.nickname,
                role: loggedInUser.role
              });
              console.log('Successfully synced login user profile to Supabase.');
            } catch (sbErr) {
              console.error('Failed to sync login user profile to Supabase:', sbErr);
            }
          }
          
          if (window.opener) {
            // Post message back to parent window
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: loggedInUser }, '*');
            window.close();
          } else {
            // Full screen navigation flow
            setCurrentUser(loggedInUser);
            // Sync with all users list if needed
            const savedAllUsersStr = localStorage.getItem('nfc_platform_all_users') || '[]';
            let allUsersList: User[] = [];
            try {
              allUsersList = JSON.parse(savedAllUsersStr);
            } catch (e) {}
            if (!allUsersList.some(u => u.id === loggedInUser.id)) {
              allUsersList.push(loggedInUser);
              localStorage.setItem('nfc_platform_all_users', JSON.stringify(allUsersList));
              setUsersList(allUsersList);
            }
            setOauthProcessing(false);
            // Navigate to mypage!
            setActiveTab('mypage');
            // Clean URL query
            window.history.replaceState({}, document.title, '/');
          }
        }
      } catch (err: any) {
        console.error('OAuth processing error:', err);
        setOauthError(err.message || '로그인 처리 중 오류가 발생했습니다.');
        setOauthProcessing(false);
      }
    };

    processOauth();
  }, []);

  // Check for NFC landing tag parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tagVal = urlParams.get('tag') || urlParams.get('serial');
    
    if (tagVal) {
      // If user is already logged in as a general user, directly link it
      const savedUserStr = localStorage.getItem('nfc_platform_user');
      let loggedInUser: User | null = null;
      if (savedUserStr) {
        try {
          loggedInUser = JSON.parse(savedUserStr);
        } catch (e) {
          console.error(e);
        }
      }

      const activeUser = currentUser || loggedInUser;
      
      if (activeUser && activeUser.role === 'user') {
        if (!activeUser.favoriteArtists.includes(tagVal)) {
          const updatedUser = {
            ...activeUser,
            favoriteArtists: [...activeUser.favoriteArtists, tagVal]
          };
          // Call direct update
          handleUpdateUser(updatedUser);
          sessionStorage.setItem('nfc_just_linked_tag', tagVal);
          // Set active tab to mypage immediately to show the success modal!
          setActiveTab('mypage');
        }
      } else {
        // Save as pending tag for login/registration redirection
        setPendingNfcTag(tagVal);
        localStorage.setItem('nfc_pending_tag', tagVal);
      }
      
      // Clear URL parameters to keep it pristine and clean
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedPending = localStorage.getItem('nfc_pending_tag');
      if (savedPending) {
        setPendingNfcTag(savedPending);
      }
    }
  }, [currentUser, usersList]);

  // Load persistent user data, users list and notifications from localStorage on mount
  useEffect(() => {
    const savedAllUsers = localStorage.getItem('nfc_platform_all_users');
    let loadedUsers: User[] = [];
    if (savedAllUsers) {
      try {
        loadedUsers = JSON.parse(savedAllUsers);
        setUsersList(loadedUsers);
      } catch (e) {
        console.error('Error parsing saved all users', e);
      }
    } else {
      setUsersList(INITIAL_ALL_USERS);
      localStorage.setItem('nfc_platform_all_users', JSON.stringify(INITIAL_ALL_USERS));
      loadedUsers = INITIAL_ALL_USERS;
    }

    const savedUser = localStorage.getItem('nfc_platform_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const matched = loadedUsers.find(u => u.id === parsed.id);
        const active = matched || parsed;
        setCurrentUser(active);

        // Auto-sync fresh profile from Supabase if configured
        if (isSupabaseConfigured) {
          getProfileByKakaoId(active.id).then(sbProfile => {
            if (sbProfile) {
              const updatedUser: User = {
                ...active,
                nickname: sbProfile.nickname || active.nickname,
                role: sbProfile.role as any || active.role,
              };
              setCurrentUser(updatedUser);
              localStorage.setItem('nfc_platform_user', JSON.stringify(updatedUser));
            }
          }).catch(err => console.error('Supabase auto-sync on mount failed:', err));
        }
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }

    const savedNotifications = localStorage.getItem('nfc_platform_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Error parsing saved notifications', e);
      }
    }
  }, []);

  // Dynamically calculate and merge verified artist records from usersList into artists
  useEffect(() => {
    const customArtists = usersList.filter(u => u.role === 'artist');
    const merged = [...MOCK_ARTISTS];
    for (const user of customArtists) {
      if (user.serialNumber && !merged.some(a => a.serialNumber === user.serialNumber)) {
        merged.push({
          name: user.nickname,
          serialNumber: user.serialNumber,
          profileImage: user.profileImage,
          instagramUrl: user.instagramUrl || 'https://instagram.com/my_drawings',
          webpageUrl: user.webpageUrl || 'https://myportfolio.com',
          description: user.description || 'NFC 아트링크 인증 정식 일러스트레이터입니다.',
          recentExhibitions: []
        });
      }
    }
    setArtists(merged);
  }, [usersList]);

  // Sync state changes with localStorage
  const handleUpdateUser = (updatedUser: User | null) => {
    setCurrentUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('nfc_platform_user', JSON.stringify(updatedUser));
      
      // Update inside usersList too
      const updatedList = usersList.map(u => u.id === updatedUser.id ? updatedUser : u);
      if (!updatedList.some(u => u.id === updatedUser.id)) {
        updatedList.push(updatedUser);
      }
      setUsersList(updatedList);
      localStorage.setItem('nfc_platform_all_users', JSON.stringify(updatedList));

      // Asynchronously sync profile changes with Supabase if configured
      if (isSupabaseConfigured) {
        upsertProfile({
          kakao_id: updatedUser.id,
          nickname: updatedUser.nickname,
          role: updatedUser.role
        }).catch(err => console.error('Failed to sync updated user to Supabase:', err));
      }
    } else {
      localStorage.removeItem('nfc_platform_user');
      // If logging out, force transition back to intro
      setActiveTab('intro');
    }
  };

  const handleUpdateUsersList = (updatedList: User[]) => {
    setUsersList(updatedList);
    localStorage.setItem('nfc_platform_all_users', JSON.stringify(updatedList));

    // Also update current user if their profile was modified or deleted
    if (currentUser) {
      const updatedSelf = updatedList.find(u => u.id === currentUser.id);
      if (updatedSelf) {
        if (JSON.stringify(updatedSelf) !== JSON.stringify(currentUser)) {
          setCurrentUser(updatedSelf);
          localStorage.setItem('nfc_platform_user', JSON.stringify(updatedSelf));
        }
      } else {
        // Self was deleted! Force logout
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    handleUpdateUser(null);
  };

  const handleAddArtist = (serialNumber: string) => {
    if (!currentUser) return;
    
    // Prevent duplicate favorites
    if (currentUser.favoriteArtists.includes(serialNumber)) return;

    const updatedUser: User = {
      ...currentUser,
      favoriteArtists: [...currentUser.favoriteArtists, serialNumber]
    };
    handleUpdateUser(updatedUser);
  };

  const handleAddNotification = (newNotification: ExhibitionNotification) => {
    const updatedNotis = [newNotification, ...notifications];
    setNotifications(updatedNotis);
    localStorage.setItem('nfc_platform_notifications', JSON.stringify(updatedNotis));
  };

  if (oauthProcessing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-100 flex flex-col items-center">
          <div className="h-16 w-16 bg-[#FEE500]/10 rounded-2xl flex items-center justify-center mb-5 animate-pulse">
            <svg className="h-8 w-8 fill-[#3A1D1D]" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.316 6.007-.173.647-.624 2.338-.713 2.695-.11.439.162.433.342.313.14-.093 2.228-1.503 3.125-2.112.637.11 1.298.17 1.93.17 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-2">카카오 로그인 연동 중</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            안전하게 내 카카오 계정 정보를 연동하고 있습니다. 잠시만 기다려 주세요.
          </p>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
            <span>카카오 서버와 통신 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-950" id="application-root-container">
      {/* OAuth Error Alert overlay if any */}
      {oauthError && (
        <div className="bg-red-500 text-white text-xs py-3 px-4 text-center font-semibold flex items-center justify-center gap-2 relative z-50 animate-bounce">
          <span>⚠️ {oauthError}</span>
          <button 
            onClick={() => setOauthError(null)} 
            className="bg-black/20 hover:bg-black/30 text-white px-2 py-0.5 rounded text-[10px] font-bold"
          >
            닫기
          </button>
        </div>
      )}

      {/* Dynamic Announcement banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs py-2 px-4 text-center font-semibold tracking-wide" id="global-announcement">
        📢 오프라인 아트 페어 개막! 스마트 부스에서 실물 NFC 작가 카드를 만나보세요.
      </div>

      {/* Primary Header & Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          // Guard MyPage and Admin access
          if (tab === 'mypage' && !currentUser) {
            setIsLoginModalOpen(true);
          } else if (tab === 'admin' && (!currentUser || currentUser.role !== 'admin')) {
            setIsLoginModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport Content Area with graceful tab animations */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Introduction
                currentUser={currentUser}
                onAddArtist={handleAddArtist}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onNavigateToMypage={() => setActiveTab('mypage')}
                artists={artists}
              />
            </motion.div>
          )}

          {activeTab === 'download' && (
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AppDownload />
            </motion.div>
          )}

          {activeTab === 'mypage' && currentUser && (
            <motion.div
              key="mypage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <MyPage
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                notifications={notifications}
                onAddNotification={handleAddNotification}
                artists={artists}
              />
            </motion.div>
          )}

          {activeTab === 'admin' && currentUser && currentUser.role === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AdminPage
                currentUser={currentUser}
                usersList={usersList}
                onUpdateUsersList={handleUpdateUsersList}
                onUpdateUser={handleUpdateUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-12 text-center text-xs text-gray-400 font-sans" id="global-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-gray-500">© 2026 ITBIT. All rights reserved.</p>
          <p>고객지원: itbit.co.kr@gmail.com | 제휴문의: itbit.co.kr@gmail.com</p>
          <p className="text-[10px] opacity-75">본 플랫폼은 데모 디자인 시연용으로 작동하며 데이터는 로컬 브라우저 세션에 안전하게 임시 보관됩니다.</p>
        </div>
      </footer>

      {/* Kakao Sign Up / Login Modal */}
      <KakaoLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          let updatedUser = { ...user };
          
          // Check if there is a pending NFC tag serial number
          const savedPending = localStorage.getItem('nfc_pending_tag') || pendingNfcTag;
          if (savedPending && updatedUser.role === 'user') {
            // Automatically add the artist serial
            if (!updatedUser.favoriteArtists.includes(savedPending)) {
              updatedUser.favoriteArtists = [...updatedUser.favoriteArtists, savedPending];
            }
            // Clear the pending state and storage
            setPendingNfcTag(null);
            localStorage.removeItem('nfc_pending_tag');
            
            // Set session storage to notify MyPage to trigger success visual
            sessionStorage.setItem('nfc_just_linked_tag', savedPending);
          } else if (updatedUser.role === 'user' && updatedUser.favoriteArtists.length === 0) {
            // Only prompt if they are a brand-new user with 0 favorite artists (simulating right after sign-up)
            localStorage.setItem('open_nfc_on_login', 'true');
          }
          
          handleUpdateUser(updatedUser);
          setActiveTab('mypage'); // Automatically go to MyPage upon successful login!
        }}
      />

      {/* Prototyping Demo State Controller */}
      <StateController
        currentUser={currentUser}
        onStateChange={(user) => {
          if (user) {
            let updatedUser = { ...user };
            const savedPending = localStorage.getItem('nfc_pending_tag') || pendingNfcTag;
            
            if (savedPending && updatedUser.role === 'user') {
              if (!updatedUser.favoriteArtists.includes(savedPending)) {
                updatedUser.favoriteArtists = [...updatedUser.favoriteArtists, savedPending];
              }
              setPendingNfcTag(null);
              localStorage.removeItem('nfc_pending_tag');
              sessionStorage.setItem('nfc_just_linked_tag', savedPending);
            }
            
            handleUpdateUser(updatedUser);
            if (updatedUser.role === 'admin') {
              setActiveTab('admin');
            } else {
              setActiveTab('mypage');
            }
          } else {
            handleLogout();
          }
        }}
      />
    </div>
  );
}
