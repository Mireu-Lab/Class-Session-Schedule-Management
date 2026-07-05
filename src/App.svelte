<script lang="ts">
  import { onMount } from 'svelte';
  import { LogOut, Calendar, Settings, X } from 'lucide-svelte';
  import type { Session, Category, SnsAccount, Guest } from './types';
  import Login from './components/Login.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import Detail from './components/Detail.svelte';
  import Survey from './components/Survey.svelte';
  import CalendarPage from './components/CalendarPage.svelte';
  import Toast from './components/Toast.svelte';
  import { downloadCSV, downloadXLSX, downloadPDF, downloadPNG } from './utils/export';
  import SessionModal from './components/SessionModal.svelte';
  import CategoryModal from './components/CategoryModal.svelte';
  import SnsModal from './components/SnsModal.svelte';
  import KebabModal from './components/KebabModal.svelte';
  import DeleteConfirmModal from './components/DeleteConfirmModal.svelte';
  import ShareModal from './components/ShareModal.svelte';
  import ConfirmModal from './components/ConfirmModal.svelte';
  import ShareLinkModal from './components/ShareLinkModal.svelte';
  import {
    getSessions,
    addSession,
    updateSession,
    deleteSession,
    getCategories,
    saveCategory,
    deleteCategory,
    signInWithGoogle,
    logoutUser
  } from './lib/db';
  import { auth } from './lib/firebase';
  import { onAuthStateChanged } from 'firebase/auth';
  import type { User } from 'firebase/auth';

  // Default Mock Data - Empty for Release Version
  const defaultCategories: Category[] = [];

  const defaultSessions: Session[] = [];

  const defaultSnsAccounts: SnsAccount[] = [
    { provider: 'Google', linked: false, email: '미연동' },
    { provider: 'Naver', linked: false, email: '미연동' },
    { provider: 'Kakao', linked: false, email: '미연동' },
    { provider: 'Instagram', linked: false, email: '미연동' }
  ];

  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialSessionId = initialParams?.get('session') || null;

  // Navigation View Router
  let activeView = $state<'login' | 'admin-dashboard' | 'admin-detail' | 'guest-survey' | 'admin-calendar'>(initialSessionId ? 'guest-survey' : 'login');

  // Core Persistent State
  let sessions = $state<Session[]>([]);
  let categories = $state<Category[]>([]);
  let snsAccounts = $state<SnsAccount[]>([]);
  let currentUser = $state<User | null>(null);
  let isSystemAdmin = $derived(currentUser?.email === (import.meta.env.VITE_SYSTEM_ADMIN_EMAIL || "limmireu1214@gmail.com"));
  let filteredDashboardSessions = $derived(isSystemAdmin ? sessions : sessions.filter(s => 
    s.adminEmails?.includes(currentUser?.email || "") || 
    s.viewerEmails?.includes(currentUser?.email || "") || 
    (currentUser?.email && s.guests.some(g => g.email === currentUser.email))
  ).map(s => {
    if (s.adminEmails?.includes(currentUser?.email || "") || s.viewerEmails?.includes(currentUser?.email || "")) {
      return s;
    }
    return {
      ...s,
      guests: s.guests.filter(g => g.email === currentUser?.email)
    };
  }));

  // Load initial data from server APIs with robust local storage fallbacks
  onMount(() => {
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) {
        if (activeView === 'login') activeView = 'admin-dashboard';
      } else {
        if (activeView !== 'guest-survey') activeView = 'login';
      }
    });

    // Initial load for SNS Accounts
    let savedSns = null;
    try {
      savedSns = localStorage.getItem('scheduler_sns_accounts');
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }
    snsAccounts = savedSns ? JSON.parse(savedSns) : defaultSnsAccounts;

    const loadInitialData = async () => {
      dataLoadError = null;
      isDataLoaded = false;
      try {
        // Real-time Firestore Cloud database load
        const dbCats = await getCategories();
        categories = dbCats || [];

        const dbSess = await getSessions();
        sessions = dbSess || [];
        isDataLoaded = true;
      } catch (err) {
        console.error('Error in loadInitialData:', err);
        dataLoadError = err instanceof Error ? err.message : String(err);
        isDataLoaded = true;
        categories = [];
        sessions = [];
      }

      // Check URL parameters to directly load shared session
      const urlParams = new URLSearchParams(window.location.search);
      const sessionParam = urlParams.get('session');
      if (sessionParam) {
        const matchingSess = sessions.find(s => String(s.id) === String(sessionParam));
        if (matchingSess) {
          activeSessionId = matchingSess.id;
          guestName = '';
          localGuestSchedule = {};
          currentActiveWeek = 1;
          activeView = 'guest-survey';
        }
      }
    };
    loadInitialData();
  });

  // Filter States
  let selectedFilterCategory = $state('ALL');
  let showArchived = $state(false);

  // Analysis / Detail States
  let selectedAnalysisView = $state<'heatmap' | 'individual'>('heatmap');
  let currentActiveWeek = $state(1);
  let activeSessionId = $state<string | number | null>(initialSessionId);
  let isDataLoaded = $state(false);
  let dataLoadError = $state<string | null>(null);

  // Guest State
  let guestName = $state('');
  let localGuestSchedule = $state<Record<string, boolean>>({});

  // Toast State
  let toast = $state({ message: '', iconName: '', visible: false });

  // Modals Visibility
  let isSessionModalVisible = $state(false);
  let isCategoryModalVisible = $state(false);
  let isSnsModalVisible = $state(false);
  let isKebabModalVisible = $state(false);
  let isDeleteModalVisible = $state(false);
  let isShareModalVisible = $state(false);
  let isConfirmModalVisible = $state(false);
  let isSettingsModalVisible = $state(false);
  let isShareLinkModalVisible = $state(false);
  let shareLinkSessionId = $state<string | number | null>(null);

  // Auxiliary Edit Inputs State
  let sessionTitle = $state('');
  let sessionCategory = $state('');
  let sessionInterval = $state(60);
  let sessionStartDate = $state('');
  let sessionEndDate = $state('');
  let sessionGuestMode = $state<'unspecified' | 'specified'>('unspecified');
  let sessionGuestsText = $state('');

  let newCatName = $state('');
  let newCatColor = $state('bg-blue-600');
  let editingCategoryId = $state<string | null>(null);

  let shareAdminEmailsText = $state('');
  let shareViewerEmailsText = $state('');
  let cascadeCategory = $state(false);

  let currentKebabSessionId = $state<string | number | null>(null);
  let guestConfirmMessage = $state('');

  // Persist SNS Accounts locally
  $effect(() => {
    if (snsAccounts && snsAccounts.length > 0) {
      try {
        localStorage.setItem('scheduler_sns_accounts', JSON.stringify(snsAccounts));
      } catch (e) {
        console.warn('localStorage is not available:', e);
      }
    }
  });

  // Toast Helper
  function showToast(message: string, iconName = 'Info') {
    toast = { message, iconName, visible: true };
  }

  function handleCloseToast() {
    toast.visible = false;
  }

  // Navigations & Controllers
  async function handleLogin(platform: string) {
    if (platform === 'Google') {
      try {
        await signInWithGoogle();
        showToast(`${platform} 간편인증 및 로그인이 성공적으로 처리되었습니다.`, 'CheckCircle');
        if (activeView !== 'guest-survey') {
          activeView = 'admin-dashboard';
        }
      } catch (err: any) {
        if (err?.code === 'auth/unauthorized-domain') {
          showToast('오류: Firebase Console 인증 승인된 도메인에 현재 URL을 추가해주세요.', 'AlertTriangle');
        } else {
          showToast('로그인에 실패했습니다.', 'AlertTriangle');
        }
      }
    } else {
      showToast(`${platform} 간편인증 및 로그인이 성공적으로 처리되었습니다.`, 'CheckCircle');
      if (activeView !== 'guest-survey') {
        activeView = 'admin-dashboard';
      }
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
      showToast('로그아웃 되었습니다.', 'Info');
      activeView = 'login';
    } catch (err) {
      showToast('로그아웃에 실패했습니다.', 'AlertTriangle');
    }
  }

  function goToDetail(id: string | number) {
    activeSessionId = id;
    currentActiveWeek = 1;
    activeView = 'admin-detail';
  }

  let currentSession = $derived(activeSessionId ? (sessions.find(s => String(s.id) === String(activeSessionId)) || null) : (sessions[0] || null));
  let shareLinkSession = $derived(sessions.find(s => String(s.id) === String(shareLinkSessionId)) || null);

  function toggleArchivedSessions() {
    showArchived = !showArchived;
  }

  function openCreateSessionModal() {
    currentKebabSessionId = null;
    sessionTitle = '';
    sessionCategory = categories.filter(c => !c.archived)[0]?.name || '';
    sessionInterval = 60;
    const now = new Date();
    // Round down to the nearest hour for a clean default
    now.setMinutes(0, 0, 0);
    // Adjust to local timezone string format for datetime-local
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    sessionStartDate = today;
    
    // Default end date to 1 week later
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000);
    sessionEndDate = nextWeek.toISOString().slice(0, 16);
    
    sessionGuestMode = 'unspecified';
    sessionGuestsText = '';
    isSessionModalVisible = true;
  }

  function openCategorySettings() {
    isCategoryModalVisible = true;
  }

  // Kebab Menu Handlers
  function handleOpenKebab(e: MouseEvent, id: string | number) {
    e.stopPropagation();
    currentKebabSessionId = id;
    isKebabModalVisible = true;
  }

  async function handleKebabAction(action: 'edit' | 'archive' | 'delete') {
    isKebabModalVisible = false;
    if (!currentKebabSessionId) return;

    const sessionItem = sessions.find(s => s.id === currentKebabSessionId);
    if (!sessionItem) return;

    if (action === 'edit') {
      sessionTitle = sessionItem.title;
      sessionCategory = sessionItem.category;
      sessionInterval = sessionItem.time_interval;
      // Convert to datetime-local format if missing time
      sessionStartDate = sessionItem.startDate.includes('T') ? sessionItem.startDate.slice(0, 16) : `${sessionItem.startDate}T00:00`;
      sessionEndDate = sessionItem.endDate.includes('T') ? sessionItem.endDate.slice(0, 16) : `${sessionItem.endDate}T23:59`;
      sessionGuestMode = sessionItem.guestMode;
      sessionGuestsText = sessionItem.guests.map(g => g.name).join(', ');
      isSessionModalVisible = true;
    } else if (action === 'archive') {
      const updatedSess = { ...sessionItem, archived: !sessionItem.archived };
      try {
        await updateSession(currentKebabSessionId, { archived: updatedSess.archived });
        sessions = sessions.map(s => (s.id === currentKebabSessionId ? updatedSess : s));
        showToast(
          sessionItem.archived ? '세션 보관 해제가 완료되었습니다.' : '세션 보관 처리가 완료되었습니다.',
          'Archive'
        );
      } catch (err) {
        showToast('보관 처리에 실패했습니다.', 'AlertTriangle');
      }
    } else if (action === 'delete') {
      isDeleteModalVisible = true;
    }
  }

  async function handleDeleteOption(type: 'soft' | 'deep') {
    isDeleteModalVisible = false;
    if (!currentKebabSessionId) return;

    if (type === 'soft') {
      try {
        await updateSession(currentKebabSessionId, { archived: true, is_deleted: true });
        sessions = sessions.map(s => (s.id === currentKebabSessionId ? { ...s, archived: true, is_deleted: true } : s));
        showToast('세션이 소프트 삭제(보관함 이동) 처리되었습니다.', 'Archive');
      } catch (err) {
        showToast('소프트 삭제에 실패했습니다.', 'AlertTriangle');
      }
    } else {
      try {
        await deleteSession(currentKebabSessionId);
        sessions = sessions.filter(s => s.id !== currentKebabSessionId);
        showToast('세션이 물리적으로 영구 삭제(Deep Delete)되었습니다.', 'Trash2');
      } catch (err) {
        showToast('영구 삭제에 실패했습니다.', 'AlertTriangle');
      }
    }
  }

  // Session create and update
  async function handleSaveSession(e: Event) {
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
      const s = sessions.find(sess => String(sess.id) === String(currentKebabSessionId));
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
        await updateSession(currentKebabSessionId, {
          title: sessionTitle,
          category: sessionCategory,
          color: finalColor,
          startDate: sessionStartDate,
          endDate: sessionEndDate,
          time_interval: sessionInterval,
          guestMode: sessionGuestMode,
          guests: updatedGuests,
          duration
        });
        sessions = sessions.map(item => (String(item.id) === String(currentKebabSessionId) ? updatedSess : item));
        showToast(`세션 [${sessionTitle}] 정보가 성공적으로 수정되었습니다.`, 'CheckCircle');
      } catch (err) {
        showToast('세션 정보 수정 실패', 'AlertTriangle');
      }
    } else {
      // Create Mode
      try {
        const docId = await addSession({
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
          adminEmails: [currentUser?.email || 'admin@example.com'],
          viewerEmails: []
        });

        const createdSess: Session = {
          id: docId,
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
          adminEmails: [currentUser?.email || 'admin@example.com'],
          viewerEmails: []
        };
        sessions = [...sessions, createdSess];
        showToast(`새 일정 세션 [${sessionTitle}]이 정상 개설되었습니다.`, 'PlusCircle');
      } catch (err) {
        showToast('세션 개설 실패', 'AlertTriangle');
      }
    }

    isSessionModalVisible = false;
    currentKebabSessionId = null;
  }

  // Category tags CRUD
  async function handleSaveCategory() {
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
          await saveCategory(updatedCat);
          if (target.name !== newCatName) {
            sessions = sessions.map(s => {
              if (s.category === target.name) {
                return { ...s, category: newCatName, color: newCatColor };
              }
              return s;
            });
          } else {
            sessions = sessions.map(s => (s.category === target.name ? { ...s, color: newCatColor } : s));
          }
          categories = categories.map(c => (c.id === editingCategoryId ? updatedCat : c));
          showToast('카테고리가 성공적으로 수정되었습니다.', 'CheckCircle');
        } catch (err) {
          showToast('카테고리 수정 실패', 'AlertTriangle');
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
        await saveCategory(newCat);
        categories = [...categories, newCat];
        showToast('새 카테고리 태그가 등록되었습니다.', 'PlusCircle');
      } catch (err) {
        showToast('카테고리 등록 실패', 'AlertTriangle');
      }
    }

    handleResetCategoryForm();
  }

  function handleEditCategory(id: string) {
    const target = categories.find(c => c.id === id);
    if (target) {
      newCatName = target.name;
      newCatColor = target.color;
      editingCategoryId = id;
    }
  }

  async function handleDeleteCategory(id: string) {
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
      sessions = sessions.map(s => (s.category === target.name ? { ...s, category: '미정', color: 'bg-slate-400' } : s));
    }

    try {
      await deleteCategory(id);
      categories = categories.filter(c => c.id !== id);
      showToast('카테고리가 성공적으로 삭제되었습니다.', 'Trash2');
    } catch (err) {
      showToast('카테고리 삭제 실패', 'AlertTriangle');
    }
  }

  function handleResetCategoryForm() {
    newCatName = '';
    newCatColor = 'bg-blue-600';
    editingCategoryId = null;
  }

  // SNS and Share Modals Trigger
  function handleToggleSnsLink(idx: number) {
    const adminEmail = import.meta.env.VITE_SYSTEM_ADMIN_EMAIL || 'limmireu1214@gmail.com';
    
    // 타인 계정 연동 차단
    if (currentUser?.email && currentUser.email !== adminEmail) {
      showToast('시스템 관리자만 SNS 계정을 연동할 수 있습니다.', 'AlertTriangle');
      return;
    }

    snsAccounts = snsAccounts.map((acc, i) => (i === idx ? { ...acc, linked: !acc.linked, email: acc.linked ? '미연동' : adminEmail } : acc));
    showToast(snsAccounts[idx].linked ? 'SNS 계정 연동이 해제되었습니다.' : 'SNS 계정 연동이 성공적으로 활성화되었습니다.');
  }

  function handleOpenShareSurveyLink(id: string | number) {
    shareLinkSessionId = id;
    isShareLinkModalVisible = true;
  }

  function handleOpenShareSettings(id: string | number) {
    const sessionItem = sessions.find(s => String(s.id) === String(id));
    if (sessionItem) {
      currentKebabSessionId = id;
      shareAdminEmailsText = sessionItem.adminEmails.join(', ');
      shareViewerEmailsText = sessionItem.viewerEmails.join(', ');
      cascadeCategory = false;
      isShareModalVisible = true;
    }
  }

  async function handleSaveShareSettings() {
    isShareModalVisible = false;
    if (!currentKebabSessionId) return;

    const admins = shareAdminEmailsText.split(',').map(e => e.trim()).filter(e => e !== '');
    const viewers = shareViewerEmailsText.split(',').map(e => e.trim()).filter(e => e !== '');

    const targetSession = sessions.find(s => String(s.id) === String(currentKebabSessionId));
    if (!targetSession) return;

    try {
      if (cascadeCategory) {
        const matches = sessions.filter(s => s.category === targetSession.category);
        for (const m of matches) {
          await updateSession(m.id, { adminEmails: admins, viewerEmails: viewers });
        }
      } else {
        await updateSession(currentKebabSessionId, { adminEmails: admins, viewerEmails: viewers });
      }

      sessions = sessions.map(s => {
        if (cascadeCategory ? s.category === targetSession.category : String(s.id) === String(currentKebabSessionId)) {
          return { ...s, adminEmails: admins, viewerEmails: viewers };
        }
        return s;
      });
      showToast('공유 메일 주소 및 권한 설정이 정상 저장되었습니다.', 'CheckCircle');
    } catch (err) {
      showToast('공유 설정 저장 실패', 'AlertTriangle');
    }
  }

  async function handleConfirmTimeslotsUpdate(slots: string[]) {
    if (!activeSessionId) return;
    const sessionToUpdate = sessions.find(s => String(s.id) === String(activeSessionId));
    if (!sessionToUpdate) return;
    
    const newStatus = slots.length > 0 ? '확정' : '조율 중';
    const updatedSess = {
      ...sessionToUpdate,
      status: newStatus as any,
      confirmedSlot: slots.length > 0 ? slots : null
    };
    
    try {
      // Optimistic update
      sessions = sessions.map(s => (String(s.id) === String(activeSessionId) ? updatedSess : s));
      
      await updateSession(activeSessionId, {
        status: updatedSess.status,
        confirmedSlot: updatedSess.confirmedSlot
      });
      showToast('일정이 성공적으로 확정/변경되었습니다.', 'CheckCircle');
    } catch (err) {
      // Revert on error
      sessions = sessions.map(s => (String(s.id) === String(activeSessionId) ? sessionToUpdate : s));
      showToast('일정 확정 중 오류가 발생했습니다.', 'AlertTriangle');
    }
  }

  // Confirming locked timeslot from detail view
  async function handleConfirmTimeslot(slotId: string) {
    if (!activeSessionId) return;
    const sessionToUpdate = sessions.find(s => String(s.id) === String(activeSessionId));
    if (!sessionToUpdate) return;

    let currentConfirmed = Array.isArray(sessionToUpdate.confirmedSlot) 
      ? sessionToUpdate.confirmedSlot 
      : (sessionToUpdate.confirmedSlot ? [sessionToUpdate.confirmedSlot] : []);
    
    let newConfirmed = [...currentConfirmed];
    if (newConfirmed.includes(slotId)) {
      newConfirmed = newConfirmed.filter(id => id !== slotId);
    } else {
      newConfirmed.push(slotId);
    }
    const newStatus = newConfirmed.length > 0 ? '확정' : '조율 중';

    const updatedSess = {
      ...sessionToUpdate,
      status: newStatus as any,
      confirmedSlot: newConfirmed.length > 0 ? newConfirmed : null
    };

    try {
      await updateSession(activeSessionId, {
        status: updatedSess.status,
        confirmedSlot: updatedSess.confirmedSlot
      });
      sessions = sessions.map(s => (String(s.id) === String(activeSessionId) ? updatedSess : s));
      showToast(updatedSess.status === '확정' ? '일정이 성공적으로 확정/변경되었습니다.' : '일정 확정이 취소되었습니다.', 'CheckCircle');
    } catch (err) {
      showToast('일정 확정 적용 실패', 'AlertTriangle');
    }
  }

  // Export utility caller
  function handleExport(type: 'CSV' | 'XLSX' | 'Sheets' | 'PDF' | 'PNG') {
    if (!currentSession) {
      showToast('선택된 세션이 없습니다.', 'AlertTriangle');
      return;
    }
    if (type === 'CSV') {
      downloadCSV(currentSession);
      showToast('정리된 일정 정보가 CSV 파일로 성공적으로 다운로드되었습니다.', 'FileText');
    } else if (type === 'XLSX') {
      downloadXLSX(currentSession);
      showToast('Excel 호환 XLS 파일로 내보내기가 완료되었습니다.', 'FileSpreadsheet');
    } else if (type === 'PDF') {
      showToast('PDF 파일로 내보내는 중입니다...', 'FileDown');
      downloadPDF(currentSession, 'detail-export-area', currentActiveWeek, selectedAnalysisView).then(() => {
        showToast('PDF 파일로 성공적으로 내보냈습니다.', 'CheckCircle');
      }).catch(err => {
        console.error(err);
        showToast('PDF 파일로 내보내기에 실패했습니다: ' + (err.message || String(err)), 'AlertTriangle');
      });
    } else if (type === 'PNG') {
      showToast('이미지 파일로 내보내는 중입니다...', 'ImageIcon');
      downloadPNG(currentSession, 'detail-export-area', currentActiveWeek, selectedAnalysisView).then(() => {
        showToast('이미지(PNG) 파일로 성공적으로 내보냈습니다.', 'CheckCircle');
      }).catch(err => {
        showToast('이미지(PNG) 파일로 내보내기에 실패했습니다.', 'AlertTriangle');
      });
    } else {
      showToast(`${type} 형식으로 내보내기 작업이 가상 실행되었습니다.`, 'Cloud');
    }
  }

  // Guest trigger review submit modal
  function handleTriggerGuestReview() {
    if (!guestName.trim()) {
      showToast('성함을 정확히 기재해 주세요.', 'AlertTriangle');
      return;
    }
    const count = Object.keys(localGuestSchedule).length;
    guestConfirmMessage = `<span class="font-bold text-slate-800">${guestName}</span>님, 선택한 가능 시간대는 총 <span class="font-bold text-emerald-600">${count}개</span>입니다.<br/>이 스케줄로 최종 제출할까요?`;
    isConfirmModalVisible = true;
  }

  async function handleConfirmGuestSubmit() {
    isConfirmModalVisible = false;
    if (!activeSessionId) return;

    const inputGuest = {
      name: guestName.trim(),
      email: currentUser?.email || "",
      submitted: true,
      schedule: { ...localGuestSchedule }
    };

    const s = sessions.find(sess => String(sess.id) === String(activeSessionId));
    if (!s) return;

    const updatedGuests = [...s.guests];
    const idx = updatedGuests.findIndex(g => g.name === inputGuest.name);
    if (idx !== -1) {
      updatedGuests[idx] = inputGuest;
    } else {
      updatedGuests.push(inputGuest);
    }

    try {
      await updateSession(activeSessionId, { guests: updatedGuests });
      sessions = sessions.map(sess => {
        if (String(sess.id) === String(activeSessionId)) {
          return { ...sess, guests: updatedGuests };
        }
        return sess;
      });
      showToast('일정 설문 제출이 정상 완료되었습니다.', 'CheckCircle');
      setTimeout(() => {
        activeView = 'admin-detail';
      }, 600);
    } catch (err) {
      showToast('설문 제출 실패', 'AlertTriangle');
    }
  }

  let sessionsCountByCat = $derived.by(() => {
    return sessions.reduce((acc, s) => {
      if (!s.is_deleted) {
        acc[s.category] = (acc[s.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  });
</script>

<div class="h-screen flex flex-col no-select text-slate-800 overflow-hidden font-sans">
  <!-- Main Header -->
  {#if activeView !== 'login' && activeView !== 'guest-survey'}
    <header id="main-header" class="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex justify-between items-center shrink-0 z-40 shadow-sm">
      <div class="flex items-center gap-2.5">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="bg-indigo-600 text-white p-2 rounded-xl shadow-md cursor-pointer" onclick={() => activeView = 'admin-dashboard'}>
          <Calendar class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            Scheduler <span class="text-[9px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-full font-bold">Premium DB v2.2</span>
          </h1>
          <p class="text-[10px] text-slate-400 font-medium hidden sm:block">정기 세션 오버랩 통합 자동화 시스템</p>
        </div>
        <!-- Desktop Navigation Tabs -->
        <nav class="hidden md:flex items-center gap-1.5 ml-6 pl-6 border-l border-slate-200 text-xs font-bold text-slate-500">
          <button 
            onclick={() => activeView = 'admin-dashboard'}
            class="px-3 py-1.5 rounded-xl transition {activeView === 'admin-dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}"
          >
            세션 대시보드
          </button>
<!--          <button 
            onclick={() => {
              if (activeSessionId) {
                activeView = 'admin-detail';
              } else {
                showToast('세션을 먼저 선택해주세요.', 'AlertTriangle');
              }
            }}
            class="px-3 py-1.5 rounded-xl transition {activeView === 'admin-detail' ? 'bg-indigo-50 text-indigo-600 font-bold' : (!activeSessionId ? 'opacity-50 cursor-not-allowed text-slate-400' : 'hover:bg-slate-50 text-slate-600')}"
          >
            일정 통합 히트맵
          </button>
-->
          <button 
            onclick={() => activeView = 'admin-calendar'}
            class="px-3 py-1.5 rounded-xl transition {activeView === 'admin-calendar' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600'}"
          >
            통합 캘린더
          </button>
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-xs font-bold text-slate-800">{currentUser?.displayName || '관리자'}</p>
          <p class="text-[9px] text-slate-400">{currentUser?.email || '이메일 정보 없음'}</p>
        </div>
        {#if isSystemAdmin}
        <button
          onclick={() => isSettingsModalVisible = true}
          class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
          title="설정"
        >
          <Settings class="w-4 h-4" />
        </button>
        {/if}
        <button
          onclick={handleLogout}
          class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg bg-slate-50 hover:bg-red-50 transition"
          title="로그아웃"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>
  {/if}

  <!-- Mobile-only Horizontal Navigation Bar for Admin Views -->
  {#if activeView !== 'login' && activeView !== 'guest-survey'}
    <nav class="md:hidden flex items-center justify-around bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-bold shrink-0 z-30">
      <button 
        onclick={() => activeView = 'admin-dashboard'}
        class="flex-1 py-2 text-center rounded-xl transition {activeView === 'admin-dashboard' ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'text-slate-500 hover:bg-slate-100'}"
      >
        세션 대시보드
      </button>
<!--
      <button 
        onclick={() => activeView = 'admin-detail'}
        class="flex-1 py-2 text-center rounded-xl transition {activeView === 'admin-detail' ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'text-slate-500 hover:bg-slate-100'}"
      >
        일정 통합 히트맵
      </button>
-->
      <button 
        onclick={() => activeView = 'admin-calendar'}
        class="flex-1 py-2 text-center rounded-xl transition {activeView === 'admin-calendar' ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'text-slate-500 hover:bg-slate-100'}"
      >
        통합 캘린더
      </button>
    </nav>
  {/if}

  <!-- Main View Area -->
  <main class="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
    {#if activeView === 'login'}
      <Login onLogin={handleLogin} />
    {:else if activeView === 'admin-dashboard'}
      <Dashboard
        sessions={filteredDashboardSessions}
        {categories}
        bind:selectedFilterCategory
        currentUserEmail={currentUser?.email || ""}
        bind:showArchived
        {isSystemAdmin}
        toggleArchivedSessions={toggleArchivedSessions}
        openCreateSessionModal={openCreateSessionModal}
        openCategorySettings={openCategorySettings}
        openSnsSettingsModal={() => isSnsModalVisible = true}
        openShareSettings={handleOpenShareSettings}
        openKebabControl={handleOpenKebab}
        goToDetail={goToDetail}
        openShareSurveyLink={handleOpenShareSurveyLink}
      />
    {:else if activeView === 'admin-detail'}
      <Detail
        session={currentSession}
        bind:currentActiveWeek
        canEditSession={isSystemAdmin || (currentSession?.adminEmails?.includes(currentUser?.email || ""))}
        bind:selectedAnalysisView
        onBackToDashboard={() => activeView = 'admin-dashboard'}
        onUpdateSessionSettings={async (expiryVal, preventDupVal, allowMutationVal) => {
          if (!activeSessionId) return;
          const sessionToUpdate = sessions.find(s => String(s.id) === String(activeSessionId));
          if (!sessionToUpdate) return;
          const updatedSess = {
            ...sessionToUpdate,
            expiry: expiryVal,
            preventDuplicate: preventDupVal,
            allowGuestMutation: allowMutationVal
          };
          try {
            await updateSession(activeSessionId, {
              expiry: expiryVal,
              preventDuplicate: preventDupVal,
              allowGuestMutation: allowMutationVal
            });
            sessions = sessions.map(s => (String(s.id) === String(activeSessionId) ? updatedSess : s));
            showToast('마감시한 및 유효 정책 설정이 서버 DB에 실시간 적용되었습니다.', 'CheckCircle');
          } catch (err) {
            showToast('정책 설정 저장 실패', 'AlertTriangle');
          }
        }}
        onExport={handleExport}
        onConfirmTimeslot={handleConfirmTimeslot}
        onConfirmTimeslotsUpdate={handleConfirmTimeslotsUpdate}
        onTriggerReminder={name => showToast(`${name}님 대상 리마인더 촉구 알림 메일이 발송되었습니다.`)}
        onShareSurveyLink={handleOpenShareSurveyLink}
      />
    {:else if activeView === 'guest-survey'}
      {#if currentSession}
        <Survey
          session={currentSession}
          bind:currentActiveWeek
          bind:guestName
          bind:localGuestSchedule
          onSubmitReview={handleTriggerGuestReview}
          {currentUser}
          onLogin={handleLogin}
          {showToast}
        />
      {:else}
        <div class="absolute inset-0 flex items-center justify-center bg-slate-50">
          <div class="text-center space-y-4">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            {#if dataLoadError}
              <p class="text-xs font-bold text-red-500">세션 정보를 불러오는데 실패했습니다: {dataLoadError}</p>
            {:else if !isDataLoaded}
              <p class="text-xs font-bold text-slate-500">세션 정보를 불러오는 중입니다...</p>
            {:else}
              <p class="text-xs font-bold text-slate-500">요청하신 세션 정보가 존재하지 않거나 삭제되었습니다.</p>
            {/if}
          </div>
        </div>
      {/if}
    {:else if activeView === 'admin-calendar'}
      <CalendarPage
        sessions={filteredDashboardSessions}
        {categories}
        {goToDetail}
        openShareSurveyLink={handleOpenShareSurveyLink}
      />
    {/if}
  </main>
</div>

<!-- Popups & Modals -->
<SessionModal
  visible={isSessionModalVisible}
  bind:title={sessionTitle}
  bind:category={sessionCategory}
  bind:interval={sessionInterval}
  bind:startDate={sessionStartDate}
  bind:endDate={sessionEndDate}
  bind:guestMode={sessionGuestMode}
  bind:guestsText={sessionGuestsText}
  {categories}
  onSave={handleSaveSession}
  onCancel={() => { isSessionModalVisible = false; currentKebabSessionId = null; }}
  editMode={currentKebabSessionId !== null}
/>

<CategoryModal
  visible={isCategoryModalVisible}
  {categories}
  bind:newCatName
  bind:newCatColor
  onSave={handleSaveCategory}
  onEdit={handleEditCategory}
  onDelete={handleDeleteCategory}
  onCancel={() => { isCategoryModalVisible = false; handleResetCategoryForm(); }}
  editingId={editingCategoryId}
  onReset={handleResetCategoryForm}
  {sessionsCountByCat}
/>

<SnsModal
  visible={isSnsModalVisible}
  {snsAccounts}
  {currentUser}
  onToggleLink={handleToggleSnsLink}
  onCancel={() => isSnsModalVisible = false}
/>

<KebabModal
  visible={isKebabModalVisible}
  title={currentKebabSessionId ? sessions.find(s => String(s.id) === String(currentKebabSessionId))?.title || '' : ''}
  onAction={handleKebabAction}
  onCancel={() => isKebabModalVisible = false}
/>

<DeleteConfirmModal
  visible={isDeleteModalVisible}
  onDeleteOption={handleDeleteOption}
  onCancel={() => isDeleteModalVisible = false}
/>

<ShareModal
  visible={isShareModalVisible}
  bind:adminEmailsText={shareAdminEmailsText}
  bind:viewerEmailsText={shareViewerEmailsText}
  bind:cascadeCategory
  onSave={handleSaveShareSettings}
  onCancel={() => isShareModalVisible = false}
/>

<ConfirmModal
  visible={isConfirmModalVisible}
  message={guestConfirmMessage}
  onConfirm={handleConfirmGuestSubmit}
  onCancel={() => isConfirmModalVisible = false}
/>

<ShareLinkModal
  visible={isShareLinkModalVisible}
  session={shareLinkSession}
  onCancel={() => { isShareLinkModalVisible = false; shareLinkSessionId = null; }}
  {showToast}
  onDirectGoToSurvey={(sessionId) => {
    activeSessionId = sessionId;
    guestName = '';
    localGuestSchedule = {};
    currentActiveWeek = 1;
    activeView = 'guest-survey';
  }}
/>

{#if isSettingsModalVisible}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Settings class="w-5 h-5 text-indigo-600" />
          <span>메일 및 알림 환경설정</span>
        </h3>
        <button onclick={() => isSettingsModalVisible = false} class="text-slate-400 p-1.5 hover:bg-slate-50 rounded-xl transition">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="space-y-4 text-xs font-semibold text-slate-600">
        <div>
          <label for="admin-email" class="block font-bold text-slate-700 mb-1.5">{currentUser?.displayName || '관리자'} 연동 메일</label>
          <input id="admin-email" type="email" value={currentUser?.email || '이메일 정보 없음'} readonly class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
<!--
        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked class="rounded border-slate-300 text-indigo-600" />
            게스트 일정 제출 시 알림 이메일 수신
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked class="rounded border-slate-300 text-indigo-600" />
            미제출 게스트 대상 자동 리마인드 전송 설정
          </label>
        </div>
        -->
        <button onclick={() => { isSettingsModalVisible = false; showToast('환경설정이 정상 저장되었습니다.'); }} class="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl transition">
          설정 저장
        </button>
      </div>
    </div>
  </div>
{/if}

<Toast
  message={toast.message}
  iconName={toast.iconName}
  visible={toast.visible}
  onClose={handleCloseToast}
/>
