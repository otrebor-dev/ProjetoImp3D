import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  PlusCircle,
  FolderKanban,
  FileSpreadsheet,
  PackageCheck,
  Settings,
  Cpu,
  Bell,
  LogOut,
  Menu,
  X,
  Layers,
  ArrowLeftRight,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../core/AppContext';
import { UserRole } from '../models';
import { AuthService, NotificationService } from '../services/domain.services';
import { DEMO_USERS } from '../services/seed.service';
import { formatDateTimeBR } from '../services/validation.util';

interface NavItem {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const CLIENT_NAV: NavItem[] = [
  { to: '/cliente/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/cliente/marketplace', label: 'Marketplace 3D', Icon: Store },
  { to: '/cliente/nova-solicitacao', label: 'Nova Solicitação', Icon: PlusCircle },
  { to: '/cliente/solicitacoes', label: 'Minhas Solicitações', Icon: FolderKanban },
  { to: '/cliente/orcamentos', label: 'Orçamentos Recebidos', Icon: FileSpreadsheet },
  { to: '/cliente/pedidos', label: 'Pedidos & Produção', Icon: PackageCheck },
  { to: '/cliente/configuracoes', label: 'Configurações', Icon: Settings },
];

const PARTNER_NAV: NavItem[] = [
  { to: '/parceiro/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/parceiro/marketplace', label: 'Marketplace 3D', Icon: Store },
  { to: '/parceiro/equipamentos', label: 'Meus Equipamentos', Icon: Cpu },
  { to: '/parceiro/solicitacoes', label: 'Solicitações Recebidas', Icon: FolderKanban },
  { to: '/parceiro/orcamentos', label: 'Propostas Enviadas', Icon: FileSpreadsheet },
  { to: '/parceiro/pedidos', label: 'Pedidos & Operação', Icon: PackageCheck },
  { to: '/parceiro/configuracoes', label: 'Configurações', Icon: Settings },
];

function resolveBreadcrumb(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const roleLabel = segments[0] === 'cliente' ? 'Ambiente do Cliente' : 'Ambiente do Parceiro';
  const map: Record<string, string> = {
    dashboard: 'Visão Geral',
    marketplace: 'Mercado de Horas Ociosas',
    'nova-solicitacao': 'Nova Solicitação de Impressão',
    solicitacoes: segments[0] === 'cliente' ? 'Minhas Solicitações' : 'Solicitações Recebidas',
    orcamentos: segments[0] === 'cliente' ? 'Análise de Orçamentos' : 'Elaboração de Propostas',
    equipamentos: segments[2] === 'novo' ? 'Cadastrar / Editar Equipamento' : 'Parque de Equipamentos',
    pedidos: 'Pedidos Ativos e Histórico',
    pedido: 'Central de Acompanhamento',
    configuracoes: 'Configurações da Conta',
  };
  const page = map[segments[1] || 'dashboard'] || 'Painel';
  return `${roleLabel} / ${page}`;
}

export const AppShellLayout: React.FC = () => {
  const {
    currentUser,
    notifications,
    unreadCount,
    logout,
    switchDemoAccount,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!currentUser) return null;

  const isClient = currentUser.role === UserRole.CLIENT;
  const navItems = isClient ? CLIENT_NAV : PARTNER_NAV;
  const displayName = AuthService.getDisplayName(currentUser);
  const breadcrumb = resolveBreadcrumb(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleToggleDemoCounterpart = async () => {
    const targetId = isClient
      ? DEMO_USERS.PARTNER_PRIMARY.id
      : DEMO_USERS.CLIENT_PRIMARY.id;
    const switched = await switchDemoAccount(targetId);
    setMobileMenuOpen(false);
    navigate(
      switched.role === UserRole.CLIENT
        ? '/cliente/dashboard'
        : '/parceiro/dashboard'
    );
  };

  const handleNotificationClick = async (notifId: string, linkPath: string) => {
    await NotificationService.markAsRead(notifId);
    setNotifOpen(false);
    navigate(linkPath);
  };

  const SidebarBody = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 w-64 shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-800/80">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-base text-white tracking-tight truncate">
          ICM Marketplace
        </span>
      </div>

      {/* User Identity Summary */}
      <div className="px-5 py-4 border-b border-slate-800/80">
        <div className="text-xs text-slate-400">
          {isClient ? 'Perfil Cliente' : 'Perfil Parceiro Fornecedor'}
          {currentUser.isDemo ? ' · Demo' : ''}
        </div>
        <div className="text-sm font-semibold text-white truncate mt-0.5">
          {displayName}
        </div>
        <div className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Quick Demo Profile Switcher & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        <button
          type="button"
          onClick={() => void handleToggleDemoCounterpart()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 transition-colors text-left"
          title="Alterna instantaneamente entre o Cliente Demo e o Parceiro Demo para validar a sincronização de dados locais"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">
            {isClient ? 'Testar visão Parceiro Demo' : 'Testar visão Cliente Demo'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Encerrar sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block sticky top-0 h-screen">
        <SidebarBody />
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex h-full">
            <SidebarBody />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="m-3 h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on Left, Notifications + Primary Action on Right */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Abrir navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-slate-600 truncate">
              {breadcrumb}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                aria-label="Central de notificações"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Notificações</span>
                {unreadCount > 0 && (
                  <span className="font-mono tabular-nums font-semibold text-blue-600">
                    ({unreadCount})
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 z-40 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <span className="text-xs font-semibold text-slate-900">
                        Notificações Internas ({notifications.length})
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            void NotificationService.markAllAsRead(currentUser.id)
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Marcar lidas
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-500">
                          Nenhuma notificação registrada para este perfil.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              void handleNotificationClick(item.id, item.linkPath)
                            }
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                              item.read ? 'bg-white' : 'bg-blue-50/40'
                            }`}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`text-xs ${
                                  item.read
                                    ? 'font-medium text-slate-800'
                                    : 'font-semibold text-slate-950'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                                {formatDateTimeBR(item.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Primary Contextual Action */}
            {isClient ? (
              <button
                type="button"
                onClick={() => navigate('/cliente/nova-solicitacao')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                Nova Solicitação
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/parceiro/equipamentos/novo')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                Novo Equipamento
              </button>
            )}
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1360px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
