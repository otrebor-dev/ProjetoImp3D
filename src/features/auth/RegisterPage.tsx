import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { UserRole } from '../../models';
import { AuthService } from '../../services/domain.services';
import {
  formatCpfCnpj,
  formatPhoneBR,
  isValidCpfOrCnpj,
  isValidEmail,
  onlyDigits,
  validatePasswordStrength,
} from '../../services/validation.util';

export const RegisterPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [stateUf, setStateUf] = useState('SP');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = {
    fullName:
      !fullName.trim() || fullName.trim().length < 3
        ? role === UserRole.CLIENT
          ? 'Informe seu nome completo (mínimo 3 caracteres).'
          : 'Informe o nome completo ou razão social.'
        : null,
    cpfCnpj:
      role === UserRole.PARTNER && !isValidCpfOrCnpj(cpfCnpj)
        ? 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.'
        : null,
    email: !isValidEmail(email) ? 'Informe um endereço de e-mail válido.' : null,
    phone:
      onlyDigits(phone).length < 10
        ? 'Informe um telefone válido com DDD.'
        : null,
    password: validatePasswordStrength(password),
    confirmPassword:
      !confirmPassword || confirmPassword !== password
        ? 'A confirmação de senha não coincide.'
        : null,
    acceptedTerms: !acceptedTerms
      ? 'É obrigatório aceitar os Termos de Uso e Política de Privacidade.'
      : null,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    setServerError(null);

    if (hasErrors) return;

    setSubmitting(true);
    try {
      const created =
        role === UserRole.CLIENT
          ? await AuthService.registerClient({
              fullName,
              organization: companyName,
              email,
              password,
              phone,
              acceptedTerms,
            })
          : await AuthService.registerPartner({
              legalName: fullName,
              companyName,
              cpfCnpj,
              city,
              state: stateUf,
              email,
              password,
              phone,
              acceptedTerms,
            });

      showToast(
        'success',
        'Cadastro registrado localmente',
        'Confirme o e-mail demonstrativo na próxima etapa para liberar o acesso.'
      );
      navigate(
        `/confirmacao-email?email=${encodeURIComponent(created.email)}&token=${encodeURIComponent(
          created.emailVerificationToken || ''
        )}`
      );
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Erro ao registrar cadastro.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Criar conta na ICM
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Selecione seu perfil de atuação no ecossistema de impressão compartilhada.
        </p>
      </div>

      {/* Role Segmented Control */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1">
        <button
          type="button"
          onClick={() => setRole(UserRole.CLIENT)}
          className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            role === UserRole.CLIENT
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sou Cliente (Contratar 3D)
        </button>
        <button
          type="button"
          onClick={() => setRole(UserRole.PARTNER)}
          className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            role === UserRole.PARTNER
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sou Parceiro (Ofertar Horas)
        </button>
      </div>

      {serverError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          {serverError}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-5 space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {role === UserRole.CLIENT
              ? 'Nome completo *'
              : 'Nome completo ou Razão Social *'}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={
              role === UserRole.CLIENT
                ? 'Ex.: Mariana Ferreira'
                : 'Ex.: Alfa Prototipagem Industrial Ltda'
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          {submittedOnce && errors.fullName && (
            <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome da empresa (opcional)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome fantasia"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Telefone / WhatsApp *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              placeholder="(11) 99999-9999"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            {submittedOnce && errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        {role === UserRole.PARTNER && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                CPF ou CNPJ *
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                placeholder="00.000.000/0001-91 ou 000.000.000-00"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.cpfCnpj && (
                <p className="mt-1 text-xs text-red-600">{errors.cpfCnpj}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cidade base
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm uppercase text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            E-mail *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@empresa.com.br"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          {submittedOnce && errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Senha (letras + números) *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            {submittedOnce && errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Confirmar senha *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            {submittedOnce && errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              Li e concordo com os Termos de Uso, Regras de Intermediação em Escrow
              Demonstrativo e Política de Privacidade da ICM.
            </span>
          </label>
          {submittedOnce && errors.acceptedTerms && (
            <p className="mt-1 text-xs text-red-600">{errors.acceptedTerms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {submitting ? 'Processando cadastro...' : 'Concluir Cadastro'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Já possui cadastro?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
};
