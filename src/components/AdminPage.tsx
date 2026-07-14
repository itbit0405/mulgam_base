import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ShieldCheck, Users, Palette, Trash2, Edit2, Check, X, 
  CheckCircle2, AlertTriangle, ExternalLink, Instagram, Link, FileText, Sparkles, RefreshCw,
  Download, FileSpreadsheet
} from 'lucide-react';
import { User, ArtistMock } from '../types';
import { isSupabaseConfigured, getWriterApplications, approveWriterApplication } from '../supabaseClient';

interface AdminPageProps {
  currentUser: User;
  usersList: User[];
  onUpdateUsersList: (updatedList: User[]) => void;
  onUpdateUser: (updatedUser: User | null) => void;
  activeView: 'admin' | 'admin_users' | 'admin_artists';
}

export default function AdminPage({ currentUser, usersList, onUpdateUsersList, onUpdateUser, activeView }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'pending'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'artist' | 'artist_pending'>('all');
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'artist_pending' | 'artist' | 'admin'>('user');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editWebpage, setEditWebpage] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Approval Custom Serial Input State
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [generatedSerial, setGeneratedSerial] = useState('');

  // Status message
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  // 1. Delete Member
  const handleDeleteMember = (userId: string) => {
    if (userId === currentUser.id) {
      showToast('자기 자신은 삭제할 수 없습니다.', 'error');
      return;
    }
    
    if (window.confirm('정말로 이 회원을 완전히 삭제하시겠습니까? 관련 데이터가 모두 영구 유실됩니다.')) {
      const updated = usersList.filter(u => u.id !== userId);
      onUpdateUsersList(updated);
      showToast('회원 계정이 안전하게 영구 삭제되었습니다.');
    }
  };

  // 2. Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditNickname(user.nickname);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditSerialNumber(user.serialNumber || '');
    setEditInstagram(user.instagramUrl || '');
    setEditWebpage(user.webpageUrl || '');
    setEditDescription(user.description || '');
  };

  // 3. Save Edit Changes
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = usersList.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          nickname: editNickname,
          email: editEmail,
          role: editRole,
          serialNumber: editRole === 'artist' ? (editSerialNumber || `ART-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
          instagramUrl: editInstagram || undefined,
          webpageUrl: editWebpage || undefined,
          description: editDescription || undefined
        };
      }
      return u;
    });

    onUpdateUsersList(updated);

    // If edited user is the current user logged in, sync it
    if (editingUser.id === currentUser.id) {
      const updatedSelf = updated.find(u => u.id === currentUser.id);
      if (updatedSelf) {
        onUpdateUser(updatedSelf);
      }
    }

    setEditingUser(null);
    showToast(`${editNickname}님의 회원 정보가 성공적으로 수정되었습니다.`);
  };

  // 4. Trigger Approve flow (Open mini confirmation)
  const handleOpenApprove = (user: User) => {
    setApprovingUser(user);
    setGeneratedSerial(`ART-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // 5. Complete Artist Approval
  const handleApproveArtist = async () => {
    if (!approvingUser) return;

    if (isSupabaseConfigured) {
      try {
        const apps = await getWriterApplications();
        const matchedApp = apps.find((app: any) => {
          const profile = Array.isArray(app.PROFILES) ? app.PROFILES[0] : app.PROFILES;
          const kakaoId = profile?.kakao_id || app.user_id;
          return kakaoId === approvingUser.id && app.status === 'pending';
        });

        if (matchedApp) {
          await approveWriterApplication(matchedApp.id, approvingUser.id, generatedSerial, currentUser.id);
          console.log('Successfully approved writer application in Supabase.');
        } else {
          // Fallback if no formal application existed but admin promoted them
          const { supabase, getProfileByKakaoId } = await import('../supabaseClient');
          if (supabase) {
            let profileUuid = approvingUser.id;
            if (approvingUser.id.startsWith('kakao-') || approvingUser.id.startsWith('user_kakaotalk_') || approvingUser.id.startsWith('artist_kakaotalk_') || approvingUser.id.startsWith('admin_kakaotalk_')) {
              const profile = await getProfileByKakaoId(approvingUser.id);
              if (profile && profile.id) {
                profileUuid = profile.id;
              }
            }

            await supabase.from('WRITERS').upsert({
              id: profileUuid,
              serial_number: generatedSerial,
              approved_at: new Date().toISOString()
            }, { onConflict: 'id' });

            await supabase.from('PROFILES').update({ role: 'artist' }).eq('id', profileUuid);
            console.log('Directly promoted and synced artist to Supabase.');
          }
        }
      } catch (err) {
        console.error('Failed to sync artist approval with Supabase:', err);
      }
    }

    const updated = usersList.map(u => {
      if (u.id === approvingUser.id) {
        return {
          ...u,
          role: 'artist' as const,
          serialNumber: generatedSerial,
          // If artist is approved, pre-populate standard fans if empty
          fanUsers: u.fanUsers && u.fanUsers.length > 0 ? u.fanUsers : []
        };
      }
      return u;
    });

    onUpdateUsersList(updated);
    setApprovingUser(null);
    showToast(`🎉 ${approvingUser.nickname} 작가님이 승인되었습니다! 고유번호: ${generatedSerial}`);
  };

  // 6. Reject Artist Application (Set back to regular user)
  const handleRejectArtist = (user: User) => {
    if (window.confirm(`${user.nickname}님의 작가 승인을 반려하고 일반 회원으로 복귀시키겠습니까?`)) {
      const updated = usersList.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            role: 'user' as const,
            uploadedFiles: [] // Clear submissions
          };
        }
        return u;
      });

      onUpdateUsersList(updated);
      showToast(`${user.nickname}님의 작가 신청이 정중히 반려되었습니다.`);
    }
  };

  // 7. Switch approved Artist back to General User (Demotion)
  const handleDemoteToUser = (userId: string) => {
    const targetUser = usersList.find(u => u.id === userId);
    if (!targetUser) return;

    if (window.confirm(`정말로 ${targetUser.nickname} 작가님을 일반 사용자로 전환하시겠습니까? 할당된 일련번호와 작가 권한이 영구 해제됩니다.`)) {
      const updated = usersList.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            role: 'user' as const,
            serialNumber: undefined,
            uploadedFiles: [],
            instagramUrl: u.instagramUrl || undefined,
            webpageUrl: u.webpageUrl || undefined,
            description: undefined
          };
        }
        return u;
      });

      onUpdateUsersList(updated);

      // If the demoted user is currently logged in, sync them
      if (userId === currentUser.id) {
        const updatedSelf = updated.find(u => u.id === currentUser.id);
        if (updatedSelf) {
          onUpdateUser(updatedSelf);
        }
      }

      showToast(`${targetUser.nickname} 작가님이 일반 사용자로 성공적으로 전환되었습니다.`);
    }
  };

  // Statistics calculations
  const nonAdminUsersList = usersList.filter(u => u.role !== 'admin');
  const totalUsers = nonAdminUsersList.length;
  const regularUsersCount = nonAdminUsersList.filter(u => u.role === 'user').length;
  const verifiedArtistsCount = nonAdminUsersList.filter(u => u.role === 'artist').length;
  const pendingArtistsCount = nonAdminUsersList.filter(u => u.role === 'artist_pending').length;

  // File Download Handlers
  const handleDownloadTxt = () => {
    const artistsList = usersList.filter(u => u.role === 'artist');
    if (artistsList.length === 0) {
      showToast('다운로드할 인증 작가가 없습니다.', 'error');
      return;
    }

    let txtContent = `==================================================\n`;
    txtContent += `             ITBIT 인증 작가 고유 명단\n`;
    txtContent += `         출력 일시: ${new Date().toLocaleString()}\n`;
    txtContent += `==================================================\n\n`;
    
    artistsList.forEach((artist, index) => {
      txtContent += `[${index + 1}] 작가명: ${artist.nickname}\n`;
      txtContent += `    일련번호: ${artist.serialNumber || 'N/A'}\n`;
      txtContent += `    인스타그램: ${artist.instagramUrl || '미등록'}\n`;
      txtContent += `--------------------------------------------------\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `인증작가_명단_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('인증 작가 명단 TXT 파일 다운로드가 완료되었습니다.');
  };

  const handleDownloadCsv = () => {
    const artistsList = usersList.filter(u => u.role === 'artist');
    if (artistsList.length === 0) {
      showToast('다운로드할 인증 작가가 없습니다.', 'error');
      return;
    }

    let csvContent = "\uFEFF"; // BOM for Excel UTF-8 display
    csvContent += "순번,작가 닉네임,일련번호,인스타그램 주소\n";
    
    artistsList.forEach((artist, index) => {
      const nickname = artist.nickname.replace(/"/g, '""');
      const serial = (artist.serialNumber || '').replace(/"/g, '""');
      const instagram = (artist.instagramUrl || '').replace(/"/g, '""');
      
      csvContent += `${index + 1},"${nickname}","${serial}","${instagram}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `인증작가_명단_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('인증 작가 명단 CSV 파일 다운로드가 완료되었습니다.');
  };

  // Filters and queries
  const filteredUsers = nonAdminUsersList.filter(u => {
    const matchesSearch = 
      u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.serialNumber && u.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Filter by activeView
    if (activeView === 'admin_users') {
      return u.role === 'user';
    } else if (activeView === 'admin_artists') {
      return u.role === 'artist';
    } else if (activeView === 'admin') {
      return u.role === 'artist_pending';
    }
    return true;
  });

  const pendingUsers = nonAdminUsersList.filter(u => u.role === 'artist_pending');

  return (
    <div className="py-8 max-w-7xl mx-auto space-y-8 font-sans" id="admin-page-container">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 shadow-lg z-50 fixed top-6 left-1/2 transform -translate-x-1/2 max-w-md ${
              actionMessage.type === 'error' 
                ? 'bg-red-50 border-red-100 text-red-800' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}
          >
            {actionMessage.type === 'error' ? <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
            <span>{actionMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW 1: MAIN DASHBOARD */}
      {activeView === 'admin' && (
        <div className="space-y-8" id="admin-dashboard-view">
          {/* Header with Stats Dashboard */}
          <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-purple-600" />
                  대시보드
                </h2>
                <p className="text-xs text-gray-500">플랫폼 내의 실시간 주요 지표를 모니터링하고 작가 인증 요청을 신속하게 관리합니다.</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-100 self-start md:self-center">
                <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin-slow" />
                <span>임시 데이터 수집기 활성화됨</span>
              </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">전체 등록 회원</span>
                <p className="text-2xl font-extrabold text-gray-950">{totalUsers}명</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">일반 사용자</span>
                <p className="text-2xl font-extrabold text-indigo-600">{regularUsersCount}명</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">인증 완료 작가</span>
                <p className="text-2xl font-extrabold text-emerald-600">{verifiedArtistsCount}명</p>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/20 p-4 space-y-1 relative">
                <div className="absolute right-3 top-3 h-6 w-6 bg-red-500 text-[10px] font-extrabold text-white flex items-center justify-center rounded-full animate-bounce shadow">
                  {pendingArtistsCount}
                </div>
                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block pr-6">작가 승인 대기</span>
                <p className="text-2xl font-extrabold text-purple-700">{pendingArtistsCount}건</p>
              </div>
            </div>
          </div>

          {/* Pending Applications Box */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6" id="admin-pending-applications-panel">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                작가 인증 승인 대기
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">사용자들이 모바일 앱을 통해 제출한 인스타그램 포트폴리오와 작업 증빙자료를 검증 및 심사합니다.</p>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="text-center py-20 px-4 border border-dashed border-gray-100 rounded-3xl bg-gray-50/40">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-base font-bold text-gray-800">심사 대기 중인 신청이 없습니다!</p>
                <p className="text-xs text-gray-400 mt-1.5">현재 모든 아티스트 인증 요청이 성공적으로 처리되었습니다.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="p-6 rounded-2xl border border-yellow-100 bg-yellow-50/5 hover:border-yellow-200 hover:bg-yellow-50/10 transition-colors flex flex-col gap-5"
                    id={`pending-card-${user.id}`}
                  >
                    {/* User profile segment */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={user.profileImage}
                          alt={user.nickname}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white shadow"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-gray-950 text-base">{user.nickname}</h4>
                          <p className="text-xs text-gray-400 font-sans">{user.email} · ID: {user.id}</p>
                          {user.description && (
                            <p className="text-xs text-gray-600 font-sans mt-2 italic bg-gray-100/50 p-2.5 rounded-xl border border-gray-50">{user.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-row flex-nowrap shrink-0">
                        <button
                          onClick={() => handleRejectArtist(user)}
                          className="px-4 py-2 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50/30 hover:border-red-100 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0"
                        >
                          신청 반려
                        </button>
                        <button
                          onClick={() => handleOpenApprove(user)}
                          className="px-4.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap shrink-0"
                          id={`approve-btn-${user.id}`}
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          작가 승인
                        </button>
                      </div>
                    </div>

                    {/* Links & Portfolios info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">제출된 포트폴리오 주소</h5>
                        <div className="space-y-2">
                          {user.instagramUrl && (
                            <a
                              href={user.instagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-pink-200 text-gray-700 hover:text-pink-600 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Instagram className="h-4 w-4 text-pink-500 shrink-0" />
                                <span className="text-xs font-medium truncate">{user.instagramUrl}</span>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                            </a>
                          )}

                          {user.webpageUrl && (
                            <a
                              href={user.webpageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 text-gray-700 hover:text-indigo-600 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Link className="h-4 w-4 text-indigo-500 shrink-0" />
                                <span className="text-xs font-medium truncate">{user.webpageUrl}</span>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">증빙 첨부파일 ({user.uploadedFiles?.length || 0}건)</h5>
                        {(!user.uploadedFiles || user.uploadedFiles.length === 0) ? (
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-400">
                            첨부파일이 등록되지 않았습니다.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {user.uploadedFiles.map((file, fIdx) => (
                              <div key={fIdx} className="relative rounded-xl border border-gray-100 overflow-hidden bg-gray-50 aspect-square group">
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                  <span className="text-[10px] text-white font-bold truncate max-w-full text-center">{file.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: REGULAR MEMBERS MANAGEMENT */}
      {activeView === 'admin_users' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6" id="admin-regular-members-panel">
          <div className="border-b border-gray-100 pb-4 space-y-1">
            <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              일반 회원 관리
            </h2>
            <p className="text-xs text-gray-500">가입한 일반 회원 목록을 확인하고, 상세 정보 편집, 강제 삭제 및 인증 작가 승급 지정을 즉시 수행합니다.</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="닉네임, 이메일로 일반 회원 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-sans"
              id="admin-users-search-input"
            />
          </div>

          {/* Members Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">조건에 일치하는 일반 회원이 존재하지 않습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse" id="admin-users-table">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">회원 정보</th>
                    <th className="px-6 py-4">이메일 계정</th>
                    <th className="px-6 py-4">보유 권한</th>
                    <th className="px-6 py-4">세부 정보</th>
                    <th className="px-6 py-4 text-right">관리 작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors" id={`admin-user-row-${user.id}`}>
                      {/* Profile Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profileImage}
                            alt={user.nickname}
                            className="h-10 w-10 rounded-full object-cover border border-gray-100"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{user.nickname}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-600">{user.email}</span>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          일반 사용자
                        </span>
                      </td>

                      {/* Favorites Details */}
                      <td className="px-6 py-4 font-sans">
                        <span className="text-[10px] text-gray-400 font-medium">수집한 작가 카드: {user.favoriteArtists?.length || 0}명</span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50/20 rounded-lg transition-colors"
                            title="회원 정보 수정"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteMember(user.id)}
                            className="p-1.5 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50/20 rounded-lg transition-colors"
                            title="회원 강제 영구 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: CERTIFIED ARTISTS MANAGEMENT */}
      {activeView === 'admin_artists' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6" id="admin-artists-panel">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                <Palette className="h-6 w-6 text-emerald-600" />
                인증 작가 관리
              </h2>
              <p className="text-xs text-gray-500">인증 완료된 정식 작가들의 발급 번호를 관리하며, 작가 명단을 외부 오피스 포맷(Excel/TXT)으로 빠르게 추출할 수 있습니다.</p>
            </div>

            {/* Downloader buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 text-xs font-bold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                id="admin-download-txt-btn"
              >
                <Download className="h-3.5 w-3.5 text-gray-500" />
                TXT 명단 내려받기
              </button>
              <button
                onClick={handleDownloadCsv}
                className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                id="admin-download-csv-btn"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                엑셀(CSV) 명단 내려받기
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="닉네임, 이메일, 일련번호로 인증 작가 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-sans"
              id="admin-artists-search-input"
            />
          </div>

          {/* Artists Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <Palette className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">조건에 일치하는 인증 작가가 존재하지 않습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse" id="admin-artists-table">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">작가 정보</th>
                    <th className="px-6 py-4">이메일 계정</th>
                    <th className="px-6 py-4">보유 권한</th>
                    <th className="px-6 py-4">작가 번호 / SNS 주소</th>
                    <th className="px-6 py-4 text-right">관리 작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors" id={`admin-artist-row-${user.id}`}>
                      {/* Profile Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profileImage}
                            alt={user.nickname}
                            className="h-10 w-10 rounded-full object-cover border border-gray-100"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{user.nickname}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-600">{user.email}</span>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Palette className="h-3 w-3" /> 인증 작가
                        </span>
                      </td>

                      {/* Serial / SNS Link */}
                      <td className="px-6 py-4 font-sans">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {user.serialNumber || '미지정'}
                          </span>
                          {user.instagramUrl && (
                            <a 
                              href={user.instagramUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-gray-400 hover:text-pink-600 flex items-center gap-1 mt-1 font-semibold"
                            >
                              <Instagram className="h-3 w-3" /> SNS 방문
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Demote to User */}
                          <button
                            onClick={() => handleDemoteToUser(user.id)}
                            className="px-2.5 py-1.5 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1"
                            title="일반 사용자로 회귀"
                          >
                            <Users className="h-3 w-3" /> 일반인 전환
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50/20 rounded-lg transition-colors"
                            title="회원 정보 수정"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteMember(user.id)}
                            className="p-1.5 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50/20 rounded-lg transition-colors"
                            title="회원 강제 영구 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: MEMBER INFO RE-EDITS FORM */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
              id="admin-edit-modal"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-purple-600" />
                  회원 상세 정보 강제 수정
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500">사용자 닉네임</label>
                    <input
                      type="text"
                      required
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                      id="edit-nickname-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500">이메일 계정</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                      id="edit-email-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500">회원 등급 권한</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold bg-white"
                      id="edit-role-select"
                    >
                      <option value="user">일반 사용자 (user)</option>
                      <option value="artist_pending">작가 승인 대기 (artist_pending)</option>
                      <option value="artist">인증 완료 작가 (artist)</option>
                      <option value="admin">최고 시스템 관리자 (admin)</option>
                    </select>
                  </div>

                  {editRole === 'artist' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">작가 일련번호 고유키</label>
                      <input
                        type="text"
                        required
                        value={editSerialNumber}
                        onChange={(e) => setEditSerialNumber(e.target.value)}
                        placeholder="예: ART-1004"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-mono font-bold"
                        id="edit-serial-input"
                      />
                    </div>
                  )}
                </div>

                {editRole === 'artist' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-500">인스타그램 URL</label>
                        <input
                          type="url"
                          value={editInstagram}
                          onChange={(e) => setEditInstagram(e.target.value)}
                          placeholder="https://instagram.com/account"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-500">포트폴리오 webpage URL</label>
                        <input
                          type="url"
                          value={editWebpage}
                          onChange={(e) => setEditWebpage(e.target.value)}
                          placeholder="https://portfolio.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">작가 소개 요약</label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="전시회 참관객에게 소개될 정식 작가 정보입니다."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs resize-none"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow transition-all active:scale-95"
                    id="edit-submit-btn"
                  >
                    정보 변경사항 저장
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CONFIRM ARTIST APPROVAL & SERIAL NUMBER */}
      <AnimatePresence>
        {approvingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setApprovingUser(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 z-10 space-y-5"
              id="admin-approval-confirm-modal"
            >
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">작가 최종 승인 검증</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {approvingUser.nickname}님의 가입 정보를 검증하고 NFC 탑재용 일련번호를 발급합니다.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">신청인 닉네임</span>
                  <span className="font-bold text-gray-800">{approvingUser.nickname}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">신청인 이메일</span>
                  <span className="font-medium text-gray-700">{approvingUser.email}</span>
                </div>

                <div className="pt-2 border-t border-gray-200/50 space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">자동 발급될 고유 일련번호(수정 가능)</label>
                  <input
                    type="text"
                    required
                    value={generatedSerial}
                    onChange={(e) => setGeneratedSerial(e.target.value)}
                    placeholder="예: ART-1234"
                    className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-indigo-700 text-center"
                    id="generated-serial-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors"
                >
                  보류하기
                </button>
                <button
                  type="button"
                  onClick={handleApproveArtist}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                  id="approval-confirm-btn"
                >
                  최종 승인 및 발급
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
