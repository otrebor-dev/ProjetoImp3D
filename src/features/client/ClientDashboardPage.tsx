import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, Store } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import {
  Order,
  OrderStatus,
  Project,
  Quote,
  QuoteStatus,
} from '../../models';
import {
  OrderService,
  ProjectService,
  QuoteService,
} from '../../services/domain.services';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
} from '../../services/validation.util';
import {
  ORDER_STATUS_LABEL,
  PROJECT_STATUS_LABEL,
} from '../../shared/StatusHelpers';

export const ClientDashboardPage: React.FC = () => {
  const { currentUser, dataVersion, notifications } = useApp();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const [p, q, o] = await Promise.all([
        ProjectService.listByClient(currentUser.id),
        QuoteService.listByClient(currentUser.id),
        OrderService.listByClient(currentUser.id),
      ]);
      if (active) {
        setProjects(p);
        setQuotes(q);
        setOrders(o);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion]);

  const pendingQuotesCount = quotes.filter((q) => q.status === QuoteStatus.SENT).length;
  const activeOrdersCount = orders.filter(
    (o) => o.currentStatus !== OrderStatus.COMPLETED_SHIPPED
  ).length;
  const completedOrdersCount = orders.filter(
    (o) => o.currentStatus === OrderStatus.COMPLETED_SHIPPED
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Painel do Cliente
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe solicitações técnicas, analise propostas comerciais e monitore a
            fabricação dos seus lotes em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/cliente/marketplace')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Store className="w-4 h-4" /> Explorar Máquinas
          </button>
          <button
            type="button"
            onClick={() => navigate('/cliente/nova-solicitacao')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" /> Cadastrar Projeto
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Solicitações realizadas',
            value: projects.length,
            sub: 'Projetos cadastrados',
            to: '/cliente/solicitacoes',
          },
          {
            label: 'Orçamentos recebidos',
            value: quotes.length,
            sub: 'Propostas de parceiros',
            to: '/cliente/orcamentos',
          },
          {
            label: 'Aguardando aprovação',
            value: pendingQuotesCount,
            sub: 'Pendentes de decisão',
            to: '/cliente/orcamentos',
            accent: pendingQuotesCount > 0,
          },
          {
            label: 'Pedidos em produção',
            value: activeOrdersCount,
            sub: 'Em operação / escrow',
            to: '/cliente/pedidos',
          },
          {
            label: 'Pedidos concluídos',
            value: completedOrdersCount,
            sub: 'Entregues e finalizados',
            to: '/cliente/pedidos',
          },
        ].map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
          >
            <div className="text-xs text-slate-500">{kpi.label}</div>
            <div
              className={`mt-2 font-mono tabular-nums text-2xl font-bold ${
                kpi.accent ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {kpi.value}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{kpi.sub}</div>
          </Link>
        ))}
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Orders & Requests */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Orders Table */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Pedidos Ativos & Central de Acompanhamento
              </h2>
              <Link
                to="/cliente/pedidos"
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 text-xs text-slate-500">
                Nenhum pedido gerado até o momento. Aprove um orçamento recebido para
                iniciar o acompanhamento compartilhado.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 4).map((ord) => {
                  const st = ORDER_STATUS_LABEL[ord.currentStatus];
                  return (
                    <div
                      key={ord.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-800">
                            {ord.code}
                          </span>
                          <span>·</span>
                          <span>{ord.partnerName}</span>
                          <span>·</span>
                          <span className={`font-medium ${st.colorClass}`}>
                            {st.text}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {ord.projectTitle}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                            {formatCurrencyBRL(ord.totalValueBrl)}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            Entrega: {formatDateBR(ord.estimatedDeliveryDate)}
                          </div>
                        </div>
                        <Link
                          to={`/cliente/pedido/${ord.id}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                        >
                          Acompanhar
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Latest Requests */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Minhas Solicitações Recentes
              </h2>
              <Link
                to="/cliente/solicitacoes"
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Gerenciar solicitações <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="p-6 text-xs text-slate-500">
                Nenhuma solicitação cadastrada. Clique em "Cadastrar Projeto" para enviar
                seus arquivos 3D.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {projects.slice(0, 4).map((prj) => {
                  const st = PROJECT_STATUS_LABEL[prj.status];
                  return (
                    <div
                      key={prj.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {prj.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {prj.desiredTechnology} · {prj.desiredMaterial} ·{' '}
                          <span className="font-mono tabular-nums">
                            {prj.quantity} un.
                          </span>{' '}
                          · <span className={`font-medium ${st.colorClass}`}>{st.text}</span>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-xs text-slate-400 shrink-0">
                        {formatDateBR(prj.desiredDeadline)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Pending Quotes & Recent Movements */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pending Quotes Action Box */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Propostas Aguardando Sua Análise ({pendingQuotesCount})
              </h2>
              <Link
                to="/cliente/orcamentos"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Analisar
              </Link>
            </div>

            {pendingQuotesCount === 0 ? (
              <div className="p-5 text-xs text-slate-500">
                Não há orçamentos pendentes de decisão no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {quotes
                  .filter((q) => q.status === QuoteStatus.SENT)
                  .slice(0, 3)
                  .map((q) => (
                    <div key={q.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {q.projectTitle}
                          </div>
                          <div className="text-xs text-slate-500">
                            Parceiro: {q.partnerName} ·{' '}
                            {q.productionLeadDays + q.deliveryLeadDays} dias úteis
                          </div>
                        </div>
                        <div className="font-mono tabular-nums text-sm font-bold text-blue-700 shrink-0">
                          {formatCurrencyBRL(q.totalValueBrl)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/cliente/orcamentos')}
                        className="w-full rounded-lg bg-slate-900 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                      >
                        Revisar e Aprovar / Recusar
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Latest Movements */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">
                Últimas Movimentações
              </h2>
            </div>
            {notifications.length === 0 ? (
              <div className="p-5 text-xs text-slate-500">
                Sem movimentações recentes registradas.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 5).map((n) => (
                  <Link
                    key={n.id}
                    to={n.linkPath}
                    className="block px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {n.title}
                      </span>
                      <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                        {formatDateTimeBR(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
