/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './core/AppContext';
import { PublicOnlyGuard, RoleGuard } from './core/RouteGuards';
import { EmailConfirmationPage } from './features/auth/EmailConfirmationPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ClientDashboardPage } from './features/client/ClientDashboardPage';
import { ClientOrdersPage } from './features/client/ClientOrdersPage';
import { ClientQuotesPage } from './features/client/ClientQuotesPage';
import { ClientRequestsPage } from './features/client/ClientRequestsPage';
import { NewRequestPage } from './features/client/NewRequestPage';
import { MarketplacePage } from './features/marketplace/MarketplacePage';
import { OrderTrackingCenterPage } from './features/orders/OrderTrackingCenterPage';
import { EquipmentFormPage } from './features/partner/EquipmentFormPage';
import { PartnerDashboardPage } from './features/partner/PartnerDashboardPage';
import { PartnerEquipmentPage } from './features/partner/PartnerEquipmentPage';
import { PartnerOrdersPage } from './features/partner/PartnerOrdersPage';
import { PartnerQuotesPage } from './features/partner/PartnerQuotesPage';
import { PartnerRequestsPage } from './features/partner/PartnerRequestsPage';
import { AccountSettingsPage } from './features/settings/AccountSettingsPage';
import { AppShellLayout } from './layouts/AppShellLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { UserRole } from './models';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route element={<PublicOnlyGuard />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
              <Route path="/confirmacao-email" element={<EmailConfirmationPage />} />
            </Route>
          </Route>

          {/* Rotas Protegidas — Ambiente do Cliente */}
          <Route element={<RoleGuard allowedRole={UserRole.CLIENT} />}>
            <Route element={<AppShellLayout />}>
              <Route path="/cliente/dashboard" element={<ClientDashboardPage />} />
              <Route path="/cliente/marketplace" element={<MarketplacePage />} />
              <Route path="/cliente/nova-solicitacao" element={<NewRequestPage />} />
              <Route path="/cliente/solicitacoes" element={<ClientRequestsPage />} />
              <Route path="/cliente/orcamentos" element={<ClientQuotesPage />} />
              <Route path="/cliente/pedidos" element={<ClientOrdersPage />} />
              <Route
                path="/cliente/pedido/:id"
                element={<OrderTrackingCenterPage />}
              />
              <Route
                path="/cliente/configuracoes"
                element={<AccountSettingsPage />}
              />
            </Route>
          </Route>

          {/* Rotas Protegidas — Ambiente do Parceiro */}
          <Route element={<RoleGuard allowedRole={UserRole.PARTNER} />}>
            <Route element={<AppShellLayout />}>
              <Route path="/parceiro/dashboard" element={<PartnerDashboardPage />} />
              <Route path="/parceiro/marketplace" element={<MarketplacePage />} />
              <Route
                path="/parceiro/equipamentos"
                element={<PartnerEquipmentPage />}
              />
              <Route
                path="/parceiro/equipamentos/novo"
                element={<EquipmentFormPage />}
              />
              <Route
                path="/parceiro/solicitacoes"
                element={<PartnerRequestsPage />}
              />
              <Route path="/parceiro/orcamentos" element={<PartnerQuotesPage />} />
              <Route path="/parceiro/pedidos" element={<PartnerOrdersPage />} />
              <Route
                path="/parceiro/pedido/:id"
                element={<OrderTrackingCenterPage />}
              />
              <Route
                path="/parceiro/configuracoes"
                element={<AccountSettingsPage />}
              />
            </Route>
          </Route>

          {/* Redirecionamento Raiz e Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
