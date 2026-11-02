import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, KeyRound, LogOut, RotateCcw } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { UserRole } from '../../models';
import { AuthService } from '../../services/domain.services';
import {
  formatCpfCnpj,
  formatPhoneBR,
  isValidCpfOrCnpj,
  onlyDigits,
  validatePasswordStrength,
} from '../../services/validation.util';
import { ConfirmModal } from '../../shared/StatusHelpers';

export const AccountSettingsPage: React.FC = () => {
  const {
    currentUser,
    refreshSession,
    logout,
    resetDemoData,
    showToast,
  } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const isClient = currentUser.role === UserRole.CLIENT;

  // Profile fields
  const [name, setName] = useState(
    isClient
      ? currentUser.clientProfile?.fullName || ''
      : currentUser.partnerProfile?.legalName || ''
  );
  const [company, setCompany] = useState(
    isClient
      ? currentUser.clientProfile?.organization || ''
      : currentUser.partnerProfile?.companyName || ''
  );
  const [departmentOrBio, setDepartmentOrBio] = useState(
    isClient
      ? currentUser.clientProfile?.department || ''
      : currentUser.partnerProfile?.bio || ''
  );
  const [cpfCnpj, setCpfCnpj] = useState(
    currentUser.partnerProfile?.cpfCnpj || ''
  );
  const [city, setCity] = useState(
    isClient
      ? currentUser.clientProfile?.defaultShippingCity || ''
      : currentUser.partnerProfile?.city || ''
  );
  const [stateUf, setStateUf] = useState(
    currentUser.partnerProfile?.state || 'SP'
  );
  const [phone, setPhone] = useState(currentUser.phone);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      showToast('error', 'Informe um nome válido (mínimo 3 caracteres).');
      return;
    }
    if (onlyDigits(phone).length < 10) {
      showToast('error', 'Informe um telefone válido com DDD.');
      return;
    }
    if (!isClient && !isValidCpfOrCnpj(cpfCnpj)) {
      showToast('error', 'O CPF ou CNPJ informado é inválido.');
      return;
    }

    setSavingProfile(true);
    try {
      if (isClient) {
        await AuthService.updateProfile(currentUser.id, {
          phone,
          clientProfile: {
            fullName: name.trim(),
            organization: company.trim(),
            department: departmentOrBio.trim(),
            defaultShippingCity: city.trim(),
          },
        });
      } else {
        await AuthService.updateProfile(currentUser.id, {
          phone,
          partnerProfile: {
            legalName: name.trim(),
            companyName: company.trim() || name.trim(),
            cpfCnpj,
            city: city.trim(),
            state: stateUf.trim().toUpperCase(),
            bio: departmentOrBio.trim(),
            rating: currentUser.partnerProfile?.rating || 5.0,
            completedJobsCount:
              currentUser.partnerProfile?.completedJobsCount || 0,
          },
        });
      }
      await refreshSession();
      showToast('success', 'Dados cadastrais atualizados com sucesso');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwdErr = validatePasswordStrength(newPassword);
    if (pwdErr) {
      showToast('error', 'Nova senha inválida', pwdErr);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('error', 'A confirmação da nova senha não coincide.');
      return;
    }

    setSavingPwd(true);
    try {
      await AuthService.changePassword(
        currentUser.id,
        currentPassword,
        newPassword
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('success', 'Senha alterada com sucesso');
    } catch (err) {
      showToast(
        'error',
        'Erro ao alterar senha',
        err instanceof Error ? err.message : 'Verifique sua senha atual.'
      );
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleResetDemo = async () => {
    await resetDemoData();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Configurações da Conta
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Visualize e edite seus dados cadastrais, gerencie sua credencial de acesso e
          controle os dados de sessão local.
        </p>
      </div>

      {/* Dados Cadastrais */}
      <form
        onSubmit={(e) => void handleSaveProfile(e)}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Dados Cadastrais ({isClient ? 'Perfil Cliente' : 'Perfil Parceiro'})
            </h2>
            <p className="text-xs text-slate-500">
              E-mail vinculado (imutável):{' '}
              <span className="font-mono text-slate-700">{currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isClient ? 'Nome completo *' : 'Razão Social / Nome Completo *'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isClient ? 'Empresa / Instituição' : 'Nome Fantasia'}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>

          {!isClient ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                CPF / CNPJ *
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cidade padrão para recebimento
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          )}
        </div>

        {!isClient && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cidade da unidade fabril
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                UF
              </label>
              <input
                type="text"
                maxLength={2}
                value={stateUf}
                onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm uppercase"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {isClient
              ? 'Departamento / Área de atuação'
              : 'Apresentação técnica do laboratório / fábrica'}
          </label>
          <textarea
            rows={2}
            value={departmentOrBio}
            onChange={(e) => setDepartmentOrBio(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {savingProfile ? 'Salvando...' : 'Salvar Dados Cadastrais'}
          </button>
        </div>
      </form>

      {/* Alteração de Senha */}
      <form
        onSubmit={(e) => void handleChangePassword(e)}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
          Alteração de Senha
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Senha atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPwd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {savingPwd ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </div>
      </form>

      {/* Sessão e Ambiente Local */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Controle de Sessão e Armazenamento Local
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Nota de arquitetura: Esta primeira versão opera exclusivamente no navegador
            utilizando IndexedDB e LocalStorage. Não há criptografia de servidor de
            produção, envio externo de e-mail real, liquidação bancária real nem
            sincronização automática entre dispositivos distintos.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Base Demonstrativa Inicial
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
          >
            <LogOut className="w-3.5 h-3.5" /> Encerrar Sessão
          </button>
        </div>
      </section>

      <ConfirmModal
        open={confirmResetOpen}
        title="Restaurar dados demonstrativos originais?"
        description="Esta ação limpará alterações manuais feitas no IndexedDB local e recriará os cadastros, arquivos STL, orçamentos e pedidos demonstrativos padrão."
        confirmLabel="Sim, restaurar base demo"
        danger
        onConfirm={() => void handleResetDemo()}
        onClose={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};
