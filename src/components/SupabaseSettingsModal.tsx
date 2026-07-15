import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Key, Link2, Copy, Check, RotateCcw, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function SupabaseSettingsModal({ isOpen, onClose, onSaveSuccess }: SupabaseSettingsModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(localStorage.getItem('CUSTOM_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || '');
      setAnonKey(localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
      setTestStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestStatus('testing');
    setErrorMessage('');

    const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestStatus('error');
      setErrorMessage('Supabase URL과 Anon Key를 모두 입력해 주세요.');
      return;
    }

    try {
      // 1. Initialize temporary client
      const tempClient = createClient(cleanUrl, cleanKey);
      
      // 2. Perform test query to check database connection and schema
      // We try to query 'profiles' to see if the table exists and is accessible
      const { data, error } = await tempClient
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        // Handle specific supabase postgres error codes
        if (error.code === 'PGRST116' || error.code === 'PGRST105' || error.message?.includes('does not exist')) {
          throw new Error(`[테이블 누락] Supabase 연결은 성공했으나, 'profiles' 테이블이 존재하지 않거나 스키마가 일치하지 않습니다. 아래 SQL 코드를 복사하여 Supabase SQL Editor에 실행해 주세요.\n(에러: ${error.message})`);
        } else if (error.message?.includes('Invalid API key') || error.message?.includes('invalid JWT')) {
          throw new Error(`[인증 에러] Anon API Key가 올바르지 않습니다. 다시 복사해서 붙여넣어 주세요.\n(에러: ${error.message})`);
        } else {
          throw new Error(`[연결 에러] 데이터베이스 응답 오류: ${error.message} (코드: ${error.code})`);
        }
      }

      // 3. Save to localStorage on success
      localStorage.setItem('CUSTOM_SUPABASE_URL', cleanUrl);
      localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', cleanKey);
      
      setTestStatus('success');
      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Supabase test connection failed:', err);
      setTestStatus('error');
      setErrorMessage(err.message || 'Supabase 연결에 실패했습니다. URL 또는 Anon Key가 올바른지 다시 확인해 주세요.');
    }
  };

  const handleReset = () => {
    if (confirm('직접 입력한 Supabase 설정을 지우고 기본 설정(환경변수)으로 복원하시겠습니까?')) {
      localStorage.removeItem('CUSTOM_SUPABASE_URL');
      localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
      setUrl(import.meta.env.VITE_SUPABASE_URL || '');
      setAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
      setTestStatus('idle');
      setErrorMessage('');
      
      onSaveSuccess();
      alert('기본 설정으로 복원되었습니다.');
    }
  };

  const sqlScript = `-- 1. profiles 테이블 생성 SQL 스크립트
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_id TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  profile_image_url TEXT,
  role TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 행 레벨 보안(RLS) 비활성화 또는 단순화 정책 (테스트/프리뷰용)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert/update profiles" ON profiles
  FOR ALL WITH CHECK (true);`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
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
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 shadow-2xl flex flex-col max-h-[90vh]"
          id="supabase-settings-modal-box"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            id="close-supabase-settings-btn"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-left mb-6 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 font-sans">
                Supabase 실시간 연동 및 자가진단
              </h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              사용자 본인의 Supabase 프로젝트와 실시간으로 연동할 수 있도록 환경을 설정합니다.
              카카오 로그인 시 사용자의 정보가 이 데이터베이스의 <code className="font-mono bg-gray-50 px-1 rounded border">profiles</code> 테이블에 직접 기록됩니다.
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-left scrollbar-thin">
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5 text-gray-400" />
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-sans"
                  id="custom-supabase-url"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Supabase Dashboard의 Project Settings - API - Project URL 값을 붙여넣으세요.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-gray-400" />
                  Supabase Anon Key (API Key)
                </label>
                <textarea
                  required
                  rows={2}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  id="custom-supabase-anon-key"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Project Settings - API - Project API keys - <code className="bg-gray-50 px-1 rounded">anon</code> public 키를 붙여넣으세요.
                </p>
              </div>

              {testStatus === 'success' && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 animate-bounce" />
                  <div>
                    <span className="font-bold">연동 테스트 대성공!</span> 연결 설정을 브라우저에 임시 저장했습니다. 이제 카카오 로그인 시 데이터가 즉시 들어갑니다!
                  </div>
                </div>
              )}

              {testStatus === 'error' && (
                <div className="space-y-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                    연동 실패 (아래 원인을 진단해 보세요)
                  </div>
                  <p className="font-mono bg-white p-2 rounded border border-red-100 text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-500 transition-colors flex items-center justify-center gap-1"
                  title="환경변수 기본값으로 되돌리기"
                >
                  <RotateCcw className="h-4 w-4" />
                  초기화
                </button>
                <button
                  type="submit"
                  disabled={testStatus === 'testing'}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100"
                  id="test-save-supabase-btn"
                >
                  {testStatus === 'testing' ? '연동 여부 테스트 중...' : '연동 테스트 및 저장'}
                </button>
              </div>
            </form>

            <div className="border-t border-gray-100 pt-5 space-y-3.5">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="text-xs font-extrabold text-gray-800">Supabase 테이블 자가진단 가이드</h3>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1.5 leading-relaxed">
                <p>
                  카카오 로그인 시 profiles 테이블에 데이터를 정상적으로 기록하려면 아래 명세와 컬럼이 일치해야 합니다.
                  가장 빠른 해결을 위해 아래 SQL 쿼리를 복사한 뒤, 
                  본인의 <span className="font-bold text-gray-800">Supabase Dashboard - SQL Editor - New Query</span> 창에 붙여넣어 실행해 주세요.
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={() => copyToClipboard(sqlScript, 'sql')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-900/10 hover:bg-gray-900/20 text-gray-600 hover:text-gray-900 transition-colors"
                  title="SQL 쿼리 복사"
                >
                  {copiedText === 'sql' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <pre className="bg-gray-900 text-gray-300 p-4 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed max-h-56 select-all">
                  {sqlScript}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
