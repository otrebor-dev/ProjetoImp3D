import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { UserRole } from '../../models';
import { AuthService } from '../../services/domain.services';
import { DEMO_USERS } from '../../services/seed.service';
import { isValidEmail } from '../../services/validation.util';

export const LoginPage: React.FC = () => {
  const { refreshSession, showToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailError =
    touched.email && !email.trim()
      ? 'Informe seu endereço de e-mail.'
      : touched.email && !isValidEmail(email)
      ? 'Formato de e-mail inválido.'
      : null;

  const passwordError =
    touched.password && !password
      ? 'Informe sua senha de acesso.'
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);

    if (!isValidEmail(email) || !password) return;

    setSubmitting(true);
    try {
      const user = await AuthService.login(email, password);
      await refreshSession();
      showToast(
        'success',
        'Autenticação concluída',
        `Bem-vindo(a), ${AuthService.getDisplayName(user)}.`
      );
      navigate(
        user.role === UserRole.CLIENT ? '/cliente/dashboard' : '/parceiro/dashboard',
        { replace: true }
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_NOT_VERIFIED') {
        showToast(
          'info',
          'Confirmação de e-mail pendente',
          'Conclua a confirmação demonstrativa de e-mail para ativar sua conta.'
        );
        navigate(`/confirmacao-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setFormError(
        err instanceof Error ? err.message : 'Falha ao autenticar usuário.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormError(null);
  };

  return (
    <div>
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Acessar plataforma ICM
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Entre com sua conta de Cliente ou Parceiro para gerenciar horas produtivas e
          solicitações.
        </p>
      </div>

      {formError && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          {formError}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            E-mail corporativo ou pessoal
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com.br"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
              emailError
                ? 'border-red-400 focus:ring-red-200'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
            }`}
          />
          {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
              passwordError
                ? 'border-red-400 focus:ring-red-200'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
            }`}
          />
          {passwordError && (
            <p className="mt-1 text-xs text-red-600">{passwordError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          {submitting ? 'Autenticando...' : 'Entrar na plataforma'}
        </button>
      </form>

      {/* Credenciais Demonstrativas Preenchíveis */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold text-slate-800">
          Credenciais demonstrativas (clique para preencher):
        </div>
        <div className="mt-2.5 space-y-2 text-xs">
          <button
            type="button"
            onClick={() =>
              fillCredentials(
                DEMO_USERS.CLIENT_PRIMARY.email,
                DEMO_USERS.CLIENT_PRIMARY.password
              )
            }
            className="w-full flex items-center justify-between rounded border border-slate-200 px-3 py-2 hover:bg-slate-50 text-left transition-colors"
          >
            <span className="font-medium text-slate-800">Cliente Demo</span>
            <span className="font-mono text-slate-500">
              {DEMO_USERS.CLIENT_PRIMARY.email} · {DEMO_USERS.CLIENT_PRIMARY.password}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              fillCredentials(
                DEMO_USERS.PARTNER_PRIMARY.email,
                DEMO_USERS.PARTNER_PRIMARY.password
              )
            }
            className="w-full flex items-center justify-between rounded border border-slate-200 px-3 py-2 hover:bg-slate-50 text-left transition-colors"
          >
            <span className="font-medium text-slate-800">Parceiro Demo</span>
            <span className="font-mono text-slate-500">
              {DEMO_USERS.PARTNER_PRIMARY.email} · {DEMO_USERS.PARTNER_PRIMARY.password}
            </span>
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Ainda não possui conta?{' '}
        <Link to="/cadastro" className="font-semibold text-blue-600 hover:underline">
          Criar cadastro de Cliente ou Parceiro
        </Link>
      </p>
    </div>
  );
};
