import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '../models';
import { useApp } from './AppContext';

export const PublicOnlyGuard: React.FC = () => {
  const { ready, currentUser } = useApp();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Inicializando ambiente ICM...</div>
      </div>
    );
  }

  if (currentUser) {
    const dest =
      currentUser.role === UserRole.CLIENT
        ? '/cliente/dashboard'
        : '/parceiro/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
};

export const RoleGuard: React.FC<{ allowedRole: UserRole }> = ({ allowedRole }) => {
  const { ready, currentUser } = useApp();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Carregando sessão...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (currentUser.role !== allowedRole) {
    const fallback =
      currentUser.role === UserRole.CLIENT
        ? '/cliente/dashboard'
        : '/parceiro/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};
