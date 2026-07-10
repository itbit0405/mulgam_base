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
        setCurrentUser(matched || parsed);
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

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-950" id="application-root-container">
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
          <p className="font-bold text-gray-500">© 2026 mulgam Corp. All rights reserved.</p>
          <p>고객지원: support@mulgam.com | 제휴문의: partner@mulgam.com</p>
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
