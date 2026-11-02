import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Notification, User } from '../models';
import { AuthService, NotificationService } from '../services/domain.services';
import { ensureDemoSeed } from '../services/seed.service';
import { StorageService } from '../services/storage.service';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface AppContextValue {
  ready: boolean;
  currentUser: User | null;
  notifications: Notification[];
  unreadCount: number;
  dataVersion: number;
  refreshSession: () => Promise<void>;
  switchDemoAccount: (userId: string) => Promise<User>;
  logout: () => void;
  resetDemoData: () => Promise<void>;
  showToast: (kind: ToastKind, title: string, description?: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, kind, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const loadUserAndNotifications = useCallback(async () => {
    const user = await AuthService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const notifs = await NotificationService.listByUser(user.id);
      setNotifications(notifs);
    } else {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureDemoSeed(false);
        if (!mounted) return;
        await loadUserAndNotifications();
      } finally {
        if (mounted) setReady(true);
      }
    })();

    const unsubscribe = StorageService.subscribe(() => {
      setDataVersion((v) => v + 1);
      void loadUserAndNotifications();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadUserAndNotifications]);

  const refreshSession = useCallback(async () => {
    await loadUserAndNotifications();
    setDataVersion((v) => v + 1);
  }, [loadUserAndNotifications]);

  const switchDemoAccount = useCallback(
    async (userId: string) => {
      const user = await AuthService.loginById(userId);
      await loadUserAndNotifications();
      showToast(
        'info',
        `Sessão demonstrativa alterada`,
        `Conectado como ${AuthService.getDisplayName(user)}.`
      );
      return user;
    },
    [loadUserAndNotifications, showToast]
  );

  const logout = useCallback(() => {
    AuthService.logout();
    setCurrentUser(null);
    setNotifications([]);
    showToast('info', 'Sessão encerrada com segurança');
  }, [showToast]);

  const resetDemoData = useCallback(async () => {
    await ensureDemoSeed(true);
    setCurrentUser(null);
    setNotifications([]);
    setDataVersion((v) => v + 1);
    showToast(
      'success',
      'Base demonstrativa restaurada',
      'Todos os dados iniciais de demonstração foram recriados localmente.'
    );
  }, [showToast]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      currentUser,
      notifications,
      unreadCount,
      dataVersion,
      refreshSession,
      switchDemoAccount,
      logout,
      resetDemoData,
      showToast,
    }),
    [
      ready,
      currentUser,
      notifications,
      unreadCount,
      dataVersion,
      refreshSession,
      switchDemoAccount,
      logout,
      resetDemoData,
      showToast,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Toast Notifications Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg transition-all duration-150"
          >
            {toast.kind === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {toast.kind === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            {toast.kind === 'info' && (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
              className="text-slate-400 hover:text-slate-700 p-1 rounded"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser utilizado dentro de AppProvider');
  return ctx;
}
