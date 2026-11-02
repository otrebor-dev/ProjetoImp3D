import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { UserRole } from '../../models';
import { AuthService } from '../../services/domain.services';

export const EmailConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession, showToast } = useApp();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [expectedToken, setExpectedToken] = useState<string | null>(tokenParam || null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    void (async () => {
      const found = await AuthService.findByEmail(email);
      if (found?.emailVerificationToken) {
        setExpectedToken(found.emailVerificationToken);
        if (!token) setToken(found.emailVerificationToken);
      }
    })();
  }, [email, token]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Informe o e-mail cadastrado para confirmar.');
      return;
    }

    setConfirming(true);
    try {
      const user = await AuthService.confirmSimulatedEmail(email, token || undefined);
      await refreshSession();
      showToast(
        'success',
        'E-mail confirmado com sucesso',
        'Sua sessão foi iniciada automaticamente.'
      );
      navigate(
        user.role === UserRole.CLIENT ? '/cliente/dashboard' : '/parceiro/dashboard',
        { replace: true }
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha na confirmação demonstrativa.'
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div>
      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
        <MailCheck className="w-5 h-5" />
      </div>

      <h2 className="font-display text-2xl font-bold text-slate-900">
        Confirmação de E-mail (Fluxo Demonstrativo)
      </h2>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        Como esta versão opera com persistência 100% local sem servidor SMTP, simulamos
        abaixo a caixa de entrada de verificação cadastral.
      </p>

      {/* Simulated Email Message Preview */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 space-y-2">
        <div className="text-xs text-slate-500">
          De: <span className="font-mono text-slate-700">nao-responda@icm.local</span> ·
          Simulação Local
        </div>
        <div className="text-xs font-semibold text-slate-900">
          Assunto: Ative sua conta no Marketplace ICM
        </div>
        {expectedToken && (
          <div className="pt-1 text-xs text-slate-600">
            Código gerado localmente:{' '}
            <span className="font-mono font-semibold text-blue-700">{expectedToken}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleConfirm(e)} className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            E-mail da conta
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Código de confirmação demonstrativo
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Ex.: SIM-XXXXXX"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={confirming}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          {confirming ? 'Validando...' : 'Confirmar E-mail e Acessar Painel'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Voltar para tela de login
        </Link>
      </p>
    </div>
  );
};
