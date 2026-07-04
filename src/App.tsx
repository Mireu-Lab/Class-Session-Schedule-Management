import React, { useState, useEffect } from 'react';
import { LogOut, Calendar, Settings, X } from 'lucide-react';
import { Session, Category, SnsAccount, Guest } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Detail from './components/Detail';
import Survey from './components/Survey';
import CalendarPage from './components/CalendarPage';
import Toast from './components/Toast';
import { downloadCSV, downloadXLSX } from './utils/export';
import { 
  SessionModal, CategoryModal, SnsModal, KebabModal, DeleteConfirmModal, ShareModal, ConfirmModal, ShareLinkModal 
} from './components/Modals';

// Default Mock Data
const defaultCategories: Category[] = [
  { id: 'CAT-1', name: 'DataBase 세션', color: 'bg-blue-600', archived: false },
  { id: 'CAT-2', name: '합주/공연 조율', color: 'bg-emerald-500', archived: false },
  { id: 'CAT-3', name: 'Programming 세션', color: 'bg-indigo-600', archived: false },
  { id: 'CAT-4', name: 'Server 세션', color: 'bg-slate-700', archived: false }
];

const defaultSessions: Session[] = [
  {
    id: 1,
    title: '정기 오케스트라 합주 조율',
    category: '합주/공연 조율',
    color: 'bg-emerald-500',
    startDate: '2026-07-01',
    endDate: '2026-07-07',
    time_interval: 60,
    guestMode: 'unspecified',
    status: '조율 중',
    confirmedSlot: null,
    is_deleted: false,
    archived: false,
    duration: '1week',
    guests: [
      { name: '김동현', submitted: true, schedule: { 'W1-Mon-18:00': true, 'W1-Mon-19:00': true } },
      { name: '이영희', submitted: true, schedule: { 'W1-Mon-19:00': true, 'W1-Wed-20:00': true } }
    ],
    expiry: '2026-07-07T18:00',
    preventDuplicate: true,
    allowGuestMutation: true,
    adminEmails: ['dh.lee@company.com'],
    viewerEmails: []
  },
  {
    id: 2,
    title: '4주 집중 DB 테크 세미나',
    category: 'DataBase 세션',
    color: 'bg-blue-600',
    startDate: '2026-07-01',
    endDate: '2026-07-28',
    time_interval: 60,
    guestMode: 'specified',
    status: '확정',
    confirmedSlot: 'W2-Wed-09:00',
    is_deleted: false,
    archived: false,
    duration: '4weeks',
    guests: [
      { name: '박지성', submitted: true, schedule: { 'W2-Wed-09:00': true, 'W3-Mon-14:00': true } },
      { name: '손흥민', submitted: false, schedule: {} }
    ],
    expiry: '2026-07-28T18:00',
    preventDuplicate: true,
    allowGuestMutation: true,
    adminEmails: ['dh.lee@company.com'],
    viewerEmails: []
  }
];

const defaultSnsAccounts: SnsAccount[] = [
  { provider: 'Google', linked: true, email: 'dh.lee@gmail.com' },
  { provider: 'Naver', linked: false, email: '미연동' },
  { provider: 'Kakao', linked: true, email: 'dh_lee_kakao' },
  { provider: 'Instagram', linked: false, email: '미연동' }
];

export default function App() {
  // Navigation View Router
  const [activeView, setActiveView] = useState<'login' | 'admin-dashboard' | 'admin-detail' | 'guest-survey' | 'admin-calendar'>('login');

  // Core Persistent State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [snsAccounts, setSnsAccounts] = useState<SnsAccount[]>(() => {
    const saved = localStorage.getItem('scheduler_sns_accounts');
    return saved ? JSON.parse(saved) : defaultSnsAccounts;
  });

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token-dh.lee@company.com'
    };
  };

  // Load initial data from server APIs with robust local storage fallbacks
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        let loadedCategories = defaultCategories;
        const savedCats = localStorage.getItem('scheduler_categories');
        if (savedCats) {
          try {
            loadedCategories = JSON.parse(savedCats);
          } catch (e) {}
        }

        try {
          const catRes = await fetch('/api/categories', {
            headers: getAuthHeaders()
          });
          const isJson = catRes.ok && catRes.headers.get('content-type')?.includes('application/json');
          if (isJson) {
            const catData = await catRes.json();
            if (Array.isArray(catData) && catData.length > 0) {
              loadedCategories = catData;
            }
          }
        } catch (catErr) {
          console.warn('Categories fetch failed, using local storage/default data.', catErr);
        }
        setCategories(loadedCategories);
        
        let loadedSessions = defaultSessions;
        const savedSessions = localStorage.getItem('scheduler_sessions');
        if (savedSessions) {
          try {
            loadedSessions = JSON.parse(savedSessions);
          } catch (e) {}
        }

        try {
          const sessRes = await fetch('/api/sessions', {
            headers: getAuthHeaders()
          });
          const isJsonSess = sessRes.ok && sessRes.headers.get('content-type')?.includes('application/json');
          if (isJsonSess) {
            const sessData = await sessRes.json();
            if (Array.isArray(sessData) && sessData.length > 0) {
              loadedSessions = sessData;
            }
          }
        } catch (sessErr) {
          console.warn('Sessions fetch failed, using local storage/default data.', sessErr);
        }
        setSessions(loadedSessions);
      } catch (err) {
        console.error('Error in loadInitialData:', err);
        const savedCats = localStorage.getItem('scheduler_categories');
        const savedSess = localStorage.getItem('scheduler_sessions');
        setCategories(savedCats ? JSON.parse(savedCats) : defaultCategories);
        setSessions(savedSess ? JSON.parse(savedSess) : defaultSessions);
      }
    };
    loadInitialData();
  }, []);

  // Filter States
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  // Analysis / Detail States
  const [selectedAnalysisView, setSelectedAnalysisView] = useState<'heatmap' | 'individual'>('heatmap');
  const [currentActiveWeek, setCurrentActiveWeek] = useState(1);
  const [activeSessionId, setActiveSessionId] = useState<number>(1);

  // Guest State
  const [guestName, setGuestName] = useState('');
  const [localGuestSchedule, setLocalGuestSchedule] = useState<Record<string, boolean>>({});

  // Toast State
  const [toast, setToast] = useState({ message: '', iconName: '', visible: false });

  // Modals Visibility
  const [isSessionModalVisible, setIsSessionModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSnsModalVisible, setIsSnsModalVisible] = useState(false);
  const [isKebabModalVisible, setIsKebabModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isShareLinkModalVisible, setIsShareLinkModalVisible] = useState(false);
  const [shareLinkSessionId, setShareLinkSessionId] = useState<number | null>(null);

  // Auxiliary Edit Inputs State
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionCategory, setSessionCategory] = useState('');
  const [sessionInterval, setSessionInterval] = useState(60);
  const [sessionStartDate, setSessionStartDate] = useState('');
  const [sessionEndDate, setSessionEndDate] = useState('');
  const [sessionGuestMode, setSessionGuestMode] = useState<'unspecified' | 'specified'>('unspecified');
  const [sessionGuestsText, setSessionGuestsText] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-blue-600');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [shareAdminEmailsText, setShareAdminEmailsText] = useState('');
  const [shareViewerEmailsText, setShareViewerEmailsText] = useState('');
  const [cascadeCategory, setCascadeCategory] = useState(false);

  const [currentKebabSessionId, setCurrentKebabSessionId] = useState<number | null>(null);
  const [guestConfirmMessage, setGuestConfirmMessage] = useState('');

  // Persist SNS Accounts, Sessions, and Categories locally
  useEffect(() => {
    localStorage.setItem('scheduler_sns_accounts', JSON.stringify(snsAccounts));
  }, [snsAccounts]);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      localStorage.setItem('scheduler_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      localStorage.setItem('scheduler_categories', JSON.stringify(categories));
    }
  }, [categories]);

  // Toast Helper
  const showToast = (message: string, iconName = 'Info') => {
    setToast({ message, iconName, visible: true });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Navigations & Controllers
  const handleLogin = (platform: string) => {
    showToast(`${platform} 간편인증 및 로그인이 성공적으로 처리되었습니다.`, 'CheckCircle');
    setActiveView('admin-dashboard');
  };

  const handleLogout = () => {
    showToast('로그아웃 되었습니다.', 'Info');
    setActiveView('login');
  };

  const goToDetail = (id: number) => {
    setActiveSessionId(id);
    setCurrentActiveWeek(1);
    setActiveView('admin-detail');
  };

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const shareLinkSession = sessions.find(s => s.id === shareLinkSessionId) || null;

  const toggleArchivedSessions = () => {
    setShowArchived(prev => !prev);
  };

  const openCreateSessionModal = () => {
    setCurrentKebabSessionId(null);
    setSessionTitle('');
    setSessionCategory(categories.filter(c => !c.archived)[0]?.name || '');
    setSessionInterval(60);
    const today = new Date().toISOString().split('T')[0];
    setSessionStartDate(today);
    setSessionEndDate(today);
    setSessionGuestMode('unspecified');
    setSessionGuestsText('');
    setIsSessionModalVisible(true);
  };

  const openCategorySettings = () => {
    setIsCategoryModalVisible(true);
  };

  // Kebab Menu Handlers
  const handleOpenKebab = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setCurrentKebabSessionId(id);
    setIsKebabModalVisible(true);
  };

  const handleKebabAction = async (action: 'edit' | 'archive' | 'delete') => {
    setIsKebabModalVisible(false);
    if (!currentKebabSessionId) return;

    const session = sessions.find(s => s.id === currentKebabSessionId);
    if (!session) return;

    if (action === 'edit') {
      setSessionTitle(session.title);
      setSessionCategory(session.category);
      setSessionInterval(session.time_interval);
      setSessionStartDate(session.startDate);
      setSessionEndDate(session.endDate);
      setSessionGuestMode(session.guestMode);
      setSessionGuestsText(session.guests.map(g => g.name).join(', '));
      setIsSessionModalVisible(true);
    } else if (action === 'archive') {
      const updatedSess = { ...session, archived: !session.archived };
      try {
        const res = await fetch(`/api/sessions/${currentKebabSessionId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedSess)
        });
        if (res.ok) {
          setSessions(prev =>
            prev.map(s => (s.id === currentKebabSessionId ? updatedSess : s))
          );
          showToast(
            session.archived ? '세션 보관 해제가 완료되었습니다.' : '세션 보관 처리가 완료되었습니다.',
            'Archive'
          );
        } else {
          showToast('보관 처리에 실패했습니다.', 'AlertTriangle');
        }
      } catch (err) {
        showToast('서버 연결 실패', 'AlertTriangle');
      }
    } else if (action === 'delete') {
      setIsDeleteModalVisible(true);
    }
  };

  const handleDeleteOption = async (type: 'soft' | 'deep') => {
    setIsDeleteModalVisible(false);
    if (!currentKebabSessionId) return;

    if (type === 'soft') {
      try {
        const res = await fetch(`/api/sessions/${currentKebabSessionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res.ok) {
          setSessions(prev =>
            prev.map(s => (s.id === currentKebabSessionId ? { ...s, archived: true, is_deleted: true } : s))
          );
          showToast('세션이 소프트 삭제(보관함 이동) 처리되었습니다.', 'Archive');
        } else {
          showToast('소프트 삭제에 실패했습니다.', 'AlertTriangle');
        }
      } catch (err) {
        showToast('서버 연결 실패', 'AlertTriangle');
      }
    } else {
      try {
        const res = await fetch(`/api/sessions/${currentKebabSessionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res.ok) {
          setSessions(prev => prev.filter(s => s.id !== currentKebabSessionId));
          showToast('세션이 물리적으로 영구 삭제(Deep Delete)되었습니다.', 'Trash2');
        } else {
          showToast('영구 삭제에 실패했습니다.', 'AlertTriangle');
        }
      } catch (err) {
        showToast('서버 연결 실패', 'AlertTriangle');
      }
    }
  };

  // Session create and update
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const guestNames = sessionGuestsText
      .split(',')
      .map(name => name.trim())
      .filter(name => name !== '');

    const matchingCat = categories.find(c => c.name === sessionCategory);
    const finalColor = matchingCat ? matchingCat.color : 'bg-slate-400';

    const baseDate = new Date(sessionStartDate);
    const targetDate = new Date(sessionEndDate);
    const diffDays = Math.ceil((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = diffDays > 7 ? '4weeks' : '1week';

    if (currentKebabSessionId) {
      // Editing Mode
      const s = sessions.find(sess => sess.id === currentKebabSessionId);
      if (!s) return;

      const updatedGuests = guestNames.map(name => {
        const existing = s.guests.find(g => g.name === name);
        return existing ? existing : { name, submitted: false, schedule: {} };
      });

      const updatedSess: Session = {
        ...s,
        title: sessionTitle,
        category: sessionCategory,
        color: finalColor,
        startDate: sessionStartDate,
        endDate: sessionEndDate,
        time_interval: sessionInterval,
        guestMode: sessionGuestMode,
        guests: updatedGuests,
        duration
      };

      try {
        const res = await fetch(`/api/sessions/${currentKebabSessionId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedSess)
        });
        if (res.ok) {
          setSessions(prev =>
            prev.map(item => (item.id === currentKebabSessionId ? updatedSess : item))
          );
          showToast(`세션 [${sessionTitle}] 정보가 성공적으로 수정되었습니다.`, 'CheckCircle');
        } else {
          showToast('세션 정보 수정 실패', 'AlertTriangle');
        }
      } catch (err) {
        showToast('서버 연결 실패', 'AlertTriangle');
      }
    } else {
      // Create Mode
      const newSess: Session = {
        id: Date.now(),
        title: sessionTitle,
        category: sessionCategory,
        color: finalColor,
        startDate: sessionStartDate,
        endDate: sessionEndDate,
        time_interval: sessionInterval,
        guestMode: sessionGuestMode,
        status: '조율 중',
        confirmedSlot: null,
        is_deleted: false,
        archived: false,
        duration,
        guests: guestNames.map(name => ({ name, submitted: false, schedule: {} })),
        expiry: new Date(new Date(sessionEndDate).getTime() + 18 * 60 * 60 * 1000).toISOString().slice(0, 16),
        preventDuplicate: true,
        allowGuestMutation: true,
        adminEmails: ['dh.lee@company.com'],
        viewerEmails: []
      };

      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(newSess)
        });
        const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
        if (isJson) {
          const saved = await res.json();
          setSessions(prev => [...prev, saved]);
        } else {
          // Fallback to local creation
          setSessions(prev => [...prev, newSess]);
        }
        showToast(`새 일정 세션 [${sessionTitle}]이 정상 개설되었습니다.`, 'PlusCircle');
      } catch (err) {
        // Fallback on network or other API error
        setSessions(prev => [...prev, newSess]);
        showToast(`새 일정 세션 [${sessionTitle}]이 정상 개설되었습니다. (로컬 저장)`, 'PlusCircle');
      }
    }

    setIsSessionModalVisible(false);
    setCurrentKebabSessionId(null);
  };

  // Category tags CRUD
  const handleSaveCategory = async () => {
    if (!newCatName.trim()) {
      showToast('카테고리 명칭을 정확히 입력해주세요.', 'AlertTriangle');
      return;
    }

    if (editingCategoryId) {
      // Update Category
      const target = categories.find(c => c.id === editingCategoryId);
      if (target) {
        const updatedCat = { ...target, name: newCatName, color: newCatColor };
        try {
          const res = await fetch('/api/categories', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedCat)
          });
          if (res.ok) {
            if (target.name !== newCatName) {
              setSessions(prev =>
                prev.map(s => {
                  if (s.category === target.name) {
                    return { ...s, category: newCatName, color: newCatColor };
                  }
                  return s;
                })
              );
            } else {
              setSessions(prev =>
                prev.map(s => (s.category === target.name ? { ...s, color: newCatColor } : s))
              );
            }
            setCategories(prev =>
              prev.map(c => (c.id === editingCategoryId ? updatedCat : c))
            );
            showToast('카테고리가 성공적으로 수정되었습니다.', 'CheckCircle');
          } else {
            showToast('카테고리 수정 실패', 'AlertTriangle');
          }
        } catch (err) {
          showToast('서버 연결 실패', 'AlertTriangle');
        }
      }
    } else {
      // Create Category
      const newCat: Category = {
        id: `CAT-${Date.now()}`,
        name: newCatName,
        color: newCatColor,
        archived: false
      };
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(newCat)
        });
        if (res.ok) {
          setCategories(prev => [...prev, newCat]);
          showToast('새 카테고리 태그가 등록되었습니다.', 'PlusCircle');
        } else {
          showToast('카테고리 등록 실패', 'AlertTriangle');
        }
      } catch (err) {
        showToast('서버 연결 실패', 'AlertTriangle');
      }
    }

    handleResetCategoryForm();
  };

  const handleEditCategory = (id: string) => {
    const target = categories.find(c => c.id === id);
    if (target) {
      setNewCatName(target.name);
      setNewCatColor(target.color);
      setEditingCategoryId(id);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const target = categories.find(c => c.id === id);
    if (!target) return;

    const associatedCount = sessions.filter(s => s.category === target.name && !s.is_deleted).length;
    if (associatedCount > 0) {
      if (
        !window.confirm(
          `경고! 이 카테고리를 삭제하면 해당 세션들의 카테고리가 '미정'으로 변경됩니다. 정말 삭제하시겠습니까?`
        )
      ) {
        return;
      }
      setSessions(prev =>
        prev.map(s => (s.category === target.name ? { ...s, category: '미정', color: 'bg-slate-400' } : s))
      );
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
        showToast('카테고리가 성공적으로 삭제되었습니다.', 'Trash2');
      } else {
        showToast('카테고리 삭제 실패', 'AlertTriangle');
      }
    } catch (err) {
      showToast('서버 연결 실패', 'AlertTriangle');
    }
  };

  const handleResetCategoryForm = () => {
    setNewCatName('');
    setNewCatColor('bg-blue-600');
    setEditingCategoryId(null);
  };

  // SNS and Share Modals Trigger
  const handleToggleSnsLink = (idx: number) => {
    setSnsAccounts(prev =>
      prev.map((acc, i) => (i === idx ? { ...acc, linked: !acc.linked, email: acc.linked ? '미연동' : 'dh.lee@company.com' } : acc))
    );
    showToast(snsAccounts[idx].linked ? 'SNS 계정 연동이 해제되었습니다.' : 'SNS 계정 연동이 성공적으로 활성화되었습니다.');
  };

  const handleOpenShareSurveyLink = (id: number) => {
    setShareLinkSessionId(id);
    setIsShareLinkModalVisible(true);
  };

  const handleOpenShareSettings = (id: number) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentKebabSessionId(id);
      setShareAdminEmailsText(session.adminEmails.join(', '));
      setShareViewerEmailsText(session.viewerEmails.join(', '));
      setCascadeCategory(false);
      setIsShareModalVisible(true);
    }
  };

  const handleSaveShareSettings = async () => {
    setIsShareModalVisible(false);
    if (!currentKebabSessionId) return;

    const admins = shareAdminEmailsText.split(',').map(e => e.trim()).filter(e => e !== '');
    const viewers = shareViewerEmailsText.split(',').map(e => e.trim()).filter(e => e !== '');

    const targetSession = sessions.find(s => s.id === currentKebabSessionId);
    if (!targetSession) return;

    const updatedSess = {
      ...targetSession,
      adminEmails: admins,
      viewerEmails: viewers
    };

    try {
      const res = await fetch(`/api/sessions/${currentKebabSessionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedSess)
      });
      if (res.ok) {
        setSessions(prev =>
          prev.map(s => {
            if (cascadeCategory ? s.category === targetSession.category : s.id === currentKebabSessionId) {
              return { ...s, adminEmails: admins, viewerEmails: viewers };
            }
            return s;
          })
        );
        showToast('공유 메일 주소 및 권한 설정이 정상 저장되었습니다.', 'CheckCircle');
      } else {
        showToast('공유 설정 저장 실패', 'AlertTriangle');
      }
    } catch (err) {
      showToast('서버 연결 실패', 'AlertTriangle');
    }
  };

  // Confirming locked timeslot from detail view
  const handleConfirmTimeslot = async (slotId: string) => {
    const sessionToUpdate = sessions.find(s => s.id === activeSessionId);
    if (!sessionToUpdate) return;

    const updatedSess = {
      ...sessionToUpdate,
      status: '확정',
      confirmedSlot: slotId
    };

    try {
      const res = await fetch(`/api/sessions/${activeSessionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedSess)
      });
      if (res.ok) {
        setSessions(prev =>
          prev.map(s => (s.id === activeSessionId ? { ...s, status: '확정', confirmedSlot: slotId } : s))
        );
        showToast('클래스 최종 일정이 성공적으로 확정되었습니다.', 'CheckCircle');
      } else {
        showToast('일정 확정 적용 실패', 'AlertTriangle');
      }
    } catch (err) {
      showToast('서버 연결 실패', 'AlertTriangle');
    }
  };

  // Export utility caller
  const handleExport = (type: 'CSV' | 'XLSX' | 'Sheets' | 'PDF' | 'PNG') => {
    if (type === 'CSV') {
      downloadCSV(currentSession);
      showToast('정리된 일정 정보가 CSV 파일로 성공적으로 다운로드되었습니다.', 'FileText');
    } else if (type === 'XLSX') {
      downloadXLSX(currentSession);
      showToast('Excel 호환 XLS 파일로 내보내기가 완료되었습니다.', 'FileSpreadsheet');
    } else {
      showToast(`${type} 형식으로 내보내기 작업이 가상 실행되었습니다.`, 'Cloud');
    }
  };

  // Guest trigger review submit modal
  const handleTriggerGuestReview = () => {
    if (!guestName.trim()) {
      showToast('성함을 정확히 기재해 주세요.', 'AlertTriangle');
      return;
    }
    const count = Object.keys(localGuestSchedule).length;
    setGuestConfirmMessage(
      `<span className="font-bold text-slate-800">${guestName}</span>님, 선택한 가능 시간대는 총 <span className="font-bold text-emerald-600">${count}개</span>입니다.<br/>이 스케줄로 최종 제출할까요?`
    );
    setIsConfirmModalVisible(true);
  };

  const handleConfirmGuestSubmit = async () => {
    setIsConfirmModalVisible(false);

    const inputGuest = {
      name: guestName.trim(),
      submitted: true,
      schedule: { ...localGuestSchedule }
    };

    try {
      const res = await fetch(`/api/sessions/${activeSessionId}/guests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(inputGuest)
      });
      const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
      if (res.ok || !isJson) {
        setSessions(prev =>
          prev.map(s => {
            if (s.id === activeSessionId) {
              const updatedGuests = [...s.guests];
              const idx = updatedGuests.findIndex(g => g.name === inputGuest.name);
              if (idx !== -1) {
                updatedGuests[idx] = inputGuest;
              } else {
                updatedGuests.push(inputGuest);
              }
              return { ...s, guests: updatedGuests };
            }
            return s;
          })
        );
        showToast('일정 설문 제출이 정상 완료되었습니다.', 'CheckCircle');
        setTimeout(() => {
          setActiveView('admin-detail');
        }, 600);
      } else {
        const errData = await res.json();
        showToast(errData.error || '설문 제출 실패', 'AlertTriangle');
      }
    } catch (err) {
      // Offline fallback
      setSessions(prev =>
        prev.map(s => {
          if (s.id === activeSessionId) {
            const updatedGuests = [...s.guests];
            const idx = updatedGuests.findIndex(g => g.name === inputGuest.name);
            if (idx !== -1) {
              updatedGuests[idx] = inputGuest;
            } else {
              updatedGuests.push(inputGuest);
            }
            return { ...s, guests: updatedGuests };
          }
          return s;
        })
      );
      showToast('일정 설문 제출이 완료되었습니다. (로컬 저장)', 'CheckCircle');
      setTimeout(() => {
        setActiveView('admin-detail');
      }, 600);
    }
  };

  const sessionsCountByCat = sessions.reduce((acc, s) => {
    if (!s.is_deleted) {
      acc[s.category] = (acc[s.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-screen flex flex-col no-select text-slate-800 overflow-hidden font-sans">
      {/* Main Header */}
      {activeView !== 'login' && (
        <header id="main-header" className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex justify-between items-center shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md cursor-pointer" onClick={() => setActiveView('admin-dashboard')}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Scheduler <span className="text-[9px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-full font-bold">Premium DB v2.2</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">정기 세션 오버랩 통합 자동화 시스템</p>
            </div>
            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 ml-6 pl-6 border-l border-slate-200 text-xs font-bold text-slate-500">
              <button 
                onClick={() => setActiveView('admin-dashboard')}
                className={`px-3 py-1.5 rounded-xl transition ${activeView === 'admin-dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                세션 대시보드
              </button>
              <button 
                onClick={() => setActiveView('admin-detail')}
                className={`px-3 py-1.5 rounded-xl transition ${activeView === 'admin-detail' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                일정 통합 히트맵
              </button>
              <button 
                onClick={() => setActiveView('admin-calendar')}
                className={`px-3 py-1.5 rounded-xl transition ${activeView === 'admin-calendar' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                통합 캘린더
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">이동현 중간관리자</p>
              <p className="text-[9px] text-slate-400">dh.lee@company.com</p>
            </div>
            <button
              onClick={() => setIsSettingsModalVisible(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
              title="설정"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg bg-slate-50 hover:bg-red-50 transition"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Mobile-only Horizontal Navigation Bar for Admin Views */}
      {activeView !== 'login' && (
        <nav className="md:hidden flex items-center justify-around bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-bold shrink-0 z-30">
          <button 
            onClick={() => setActiveView('admin-dashboard')}
            className={`flex-1 py-2 text-center rounded-xl transition ${activeView === 'admin-dashboard' ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            세션 대시보드
          </button>
          <button 
            onClick={() => setActiveView('admin-detail')}
            className={`flex-1 py-2 text-center rounded-xl transition ${activeView === 'admin-detail' ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            일정 통합 히트맵
          </button>
          <button 
            onClick={() => setActiveView('admin-calendar')}
            className={`flex-1 py-2 text-center rounded-xl transition ${activeView === 'admin-calendar' ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            통합 캘린더
          </button>
        </nav>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeView === 'login' && <Login onLogin={handleLogin} />}

        {activeView === 'admin-dashboard' && (
          <Dashboard
            sessions={sessions}
            categories={categories}
            selectedFilterCategory={selectedFilterCategory}
            setSelectedFilterCategory={setSelectedFilterCategory}
            showArchived={showArchived}
            toggleArchivedSessions={toggleArchivedSessions}
            openCreateSessionModal={openCreateSessionModal}
            openCategorySettings={openCategorySettings}
            openSnsSettingsModal={() => setIsSnsModalVisible(true)}
            openShareSettings={handleOpenShareSettings}
            openKebabControl={handleOpenKebab}
            goToDetail={goToDetail}
            openShareSurveyLink={handleOpenShareSurveyLink}
          />
        )}

        {activeView === 'admin-detail' && (
          <Detail
            session={currentSession}
            currentActiveWeek={currentActiveWeek}
            setCurrentActiveWeek={setCurrentActiveWeek}
            selectedAnalysisView={selectedAnalysisView}
            setSelectedAnalysisView={setSelectedAnalysisView}
            onBackToDashboard={() => setActiveView('admin-dashboard')}
            onUpdateSessionSettings={async (expiry, preventDup, allowMutation) => {
              const sessionToUpdate = sessions.find(s => s.id === activeSessionId);
              if (!sessionToUpdate) return;
              const updatedSess = {
                ...sessionToUpdate,
                expiry,
                preventDuplicate: preventDup,
                allowGuestMutation: allowMutation
              };
              try {
                const res = await fetch(`/api/sessions/${activeSessionId}`, {
                  method: 'PUT',
                  headers: getAuthHeaders(),
                  body: JSON.stringify(updatedSess)
                });
                if (res.ok) {
                  setSessions(prev =>
                    prev.map(s => (s.id === activeSessionId ? updatedSess : s))
                  );
                  showToast('마감시한 및 유효 정책 설정이 서버 DB에 실시간 적용되었습니다.', 'CheckCircle');
                } else {
                  showToast('정책 설정 저장 실패', 'AlertTriangle');
                }
              } catch (err) {
                showToast('서버 연결 실패', 'AlertTriangle');
              }
            }}
            onExport={handleExport}
            onConfirmTimeslot={handleConfirmTimeslot}
            onTriggerReminder={name => showToast(`${name}님 대상 리마인더 촉구 알림 메일이 발송되었습니다.`)}
            onShareSurveyLink={handleOpenShareSurveyLink}
          />
        )}

        {activeView === 'guest-survey' && (
          <Survey
            session={currentSession}
            currentActiveWeek={currentActiveWeek}
            setCurrentActiveWeek={setCurrentActiveWeek}
            guestName={guestName}
            setGuestName={setGuestName}
            localGuestSchedule={localGuestSchedule}
            setLocalGuestSchedule={setLocalGuestSchedule}
            onSubmitReview={handleTriggerGuestReview}
            showToast={showToast}
          />
        )}

        {activeView === 'admin-calendar' && (
          <CalendarPage
            sessions={sessions}
            categories={categories}
            goToDetail={goToDetail}
            openShareSurveyLink={handleOpenShareSurveyLink}
          />
        )}
      </main>

      {/* Popups & Modals */}
      <SessionModal
        visible={isSessionModalVisible}
        title={sessionTitle}
        setTitle={setSessionTitle}
        category={sessionCategory}
        setCategory={setSessionCategory}
        interval={sessionInterval}
        setInterval={setSessionInterval}
        startDate={sessionStartDate}
        setStartDate={setSessionStartDate}
        endDate={sessionEndDate}
        setEndDate={setSessionEndDate}
        guestMode={sessionGuestMode}
        setGuestMode={setSessionGuestMode}
        guestsText={sessionGuestsText}
        setGuestsText={setSessionGuestsText}
        categories={categories}
        onSave={handleSaveSession}
        onCancel={() => { setIsSessionModalVisible(false); setCurrentKebabSessionId(null); }}
        editMode={currentKebabSessionId !== null}
      />

      <CategoryModal
        visible={isCategoryModalVisible}
        categories={categories}
        newCatName={newCatName}
        setCatName={setNewCatName}
        newCatColor={newCatColor}
        setCatColor={setNewCatColor}
        onSave={handleSaveCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        onCancel={() => { setIsCategoryModalVisible(false); handleResetCategoryForm(); }}
        editingId={editingCategoryId}
        onReset={handleResetCategoryForm}
        sessionsCountByCat={sessionsCountByCat}
      />

      <SnsModal
        visible={isSnsModalVisible}
        snsAccounts={snsAccounts}
        onToggleLink={handleToggleSnsLink}
        onCancel={() => setIsSnsModalVisible(false)}
      />

      <KebabModal
        visible={isKebabModalVisible}
        title={currentKebabSessionId ? sessions.find(s => s.id === currentKebabSessionId)?.title || '' : ''}
        onAction={handleKebabAction}
        onCancel={() => setIsKebabModalVisible(false)}
      />

      <DeleteConfirmModal
        visible={isDeleteModalVisible}
        onDeleteOption={handleDeleteOption}
        onCancel={() => setIsDeleteModalVisible(false)}
      />

      <ShareModal
        visible={isShareModalVisible}
        adminEmailsText={shareAdminEmailsText}
        setAdminEmailsText={setShareAdminEmailsText}
        viewerEmailsText={shareViewerEmailsText}
        setViewerEmailsText={setShareViewerEmailsText}
        cascadeCategory={cascadeCategory}
        setCascadeCategory={setCascadeCategory}
        onSave={handleSaveShareSettings}
        onCancel={() => setIsShareModalVisible(false)}
      />

      <ConfirmModal
        visible={isConfirmModalVisible}
        message={guestConfirmMessage}
        onConfirm={handleConfirmGuestSubmit}
        onCancel={() => setIsConfirmModalVisible(false)}
      />

      <ShareLinkModal
        visible={isShareLinkModalVisible}
        session={shareLinkSession}
        onCancel={() => { setIsShareLinkModalVisible(false); setShareLinkSessionId(null); }}
        showToast={showToast}
        onDirectGoToSurvey={(sessionId) => {
          setActiveSessionId(sessionId);
          setGuestName('');
          setLocalGuestSchedule({});
          setCurrentActiveWeek(1);
          setActiveView('guest-survey');
        }}
      />

      {/* 8. Settings Modal */}
      {isSettingsModalVisible && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>메일 및 알림 환경설정</span>
              </h3>
              <button onClick={() => setIsSettingsModalVisible(false)} className="text-slate-400 p-1.5 hover:bg-slate-50 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">이동현 중간관리자 연동 메일</label>
                <input type="email" value="dh.lee@company.com" readOnly className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
                  게스트 일정 제출 시 알림 이메일 수신
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
                  미제출 게스트 대상 자동 리마인드 전송 설정
                </label>
              </div>
              <button onClick={() => { setIsSettingsModalVisible(false); showToast('환경설정이 정상 저장되었습니다.'); }} className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl transition">
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast component */}
      <Toast
        message={toast.message}
        iconName={toast.iconName}
        visible={toast.visible}
        onClose={handleCloseToast}
      />
    </div>
  );
}
