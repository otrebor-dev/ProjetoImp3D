import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import {
  Equipment,
  Order,
  OrderStatus,
  Project,
  ProjectStatus,
  Quote,
  QuoteStatus,
} from '../../models';
import {
  EquipmentService,
  OrderService,
  ProjectService,
  QuoteService,
} from '../../services/domain.services';
import { formatCurrencyBRL, formatDateBR } from '../../services/validation.util';
import { ORDER_STATUS_LABEL } from '../../shared/StatusHelpers';

export const PartnerDashboardPage: React.FC = () => {
  const { currentUser, dataVersion } = useApp();
  const navigate = useNavigate();

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const [eq, prj, qt, ord] = await Promise.all([
        EquipmentService.listByPartner(currentUser.id),
        ProjectService.listForPartner(currentUser.id),
        QuoteService.listByPartner(currentUser.id),
        OrderService.listByPartner(currentUser.id),
      ]);
      if (active) {
        setEquipments(eq);
        setProjects(prj);
        setQuotes(qt);
        setOrders(ord);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion]);

  const totalIdleHours = equipments.reduce((acc, e) => acc + e.availableHours, 0);
  const openRequests = projects.filter(
    (p) => p.status === ProjectStatus.OPEN || p.status === ProjectStatus.IN_NEGOTIATION
  );
  const pendingQuotes = quotes.filter((q) => q.status === QuoteStatus.SENT);
  const approvedOrders = orders.filter(
    (o) => o.currentStatus === OrderStatus.ESCROW_PAYMENT
  );
  const inProductionOrders = orders.filter((o) =>
    [
      OrderStatus.IN_PRODUCTION,
      OrderStatus.QUALITY_CONTROL,
      OrderStatus.PACKAGING,
    ].includes(o.currentStatus)
  );
  const completedOrders = orders.filter(
    (o) => o.currentStatus === OrderStatus.COMPLETED_SHIPPED
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Painel Operacional do Parceiro
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Gerencie a disponibilidade horária do seu parque de máquinas, analise
            arquivos técnicos 3D e conduza a produção dos pedidos contratados.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/parceiro/solicitacoes')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" /> Analisar Solicitações
          </button>
          <button
            type="button"
            onClick={() => navigate('/parceiro/equipamentos/novo')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" /> Cadastrar Equipamento
          </button>
        </div>
      </div>

      {/* 7 Partner KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {[
          {
            label: 'Equipamentos',
            value: String(equipments.length),
            sub: 'Cadastrados',
            to: '/parceiro/equipamentos',
          },
          {
            label: 'Horas livres',
            value: `${totalIdleHours}h`,
            sub: 'Ofertadas na rede',
            to: '/parceiro/equipamentos',
          },
          {
            label: 'Solicitações',
            value: String(openRequests.length),
            sub: 'Para cotação',
            to: '/parceiro/solicitacoes',
            highlight: openRequests.length > 0,
          },
          {
            label: 'Orçamentos',
            value: String(pendingQuotes.length),
            sub: 'Pendentes cliente',
            to: '/parceiro/orcamentos',
          },
          {
            label: 'Aprovados',
            value: String(approvedOrders.length),
            sub: 'Em Escrow pronto',
            to: '/parceiro/pedidos',
          },
          {
            label: 'Em produção',
            value: String(inProductionOrders.length),
            sub: 'Na fila fabril',
            to: '/parceiro/pedidos',
          },
          {
            label: 'Concluídos',
            value: String(completedOrders.length),
            sub: 'Histórico entregue',
            to: '/parceiro/pedidos',
          },
        ].map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
          >
            <div className="text-xs text-slate-500 truncate">{kpi.label}</div>
            <div
              className={`mt-2 font-mono tabular-nums text-xl font-bold ${
                kpi.highlight ? 'text-blue-700' : 'text-slate-900'
              }`}
            >
              {kpi.value}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 truncate">{kpi.sub}</div>
          </Link>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Production Queue & History */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Fila de Produção & Histórico de Serviços
              </h2>
              <Link
                to="/parceiro/pedidos"
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Todos os pedidos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 text-xs text-slate-500">
                Nenhum pedido vinculado ainda. Envie propostas comerciais nas
                solicitações abertas para iniciar pedidos.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((ord) => {
                  const st = ORDER_STATUS_LABEL[ord.currentStatus];
                  return (
                    <div
                      key={ord.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-900">
                            {ord.code}
                          </span>
                          <span>·</span>
                          <span>Cliente: {ord.clientName}</span>
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
                          <div className="font-mono tabular-nums text-[11px] text-slate-400">
                            Meta: {formatDateBR(ord.estimatedDeliveryDate)}
                          </div>
                        </div>
                        <Link
                          to={`/parceiro/pedido/${ord.id}`}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                        >
                          Operar Pedido
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: Incoming Opportunities */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Solicitações Abertas para Cotação ({openRequests.length})
              </h2>
              <Link
                to="/parceiro/solicitacoes"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Ver todas
              </Link>
            </div>

            {openRequests.length === 0 ? (
              <div className="p-5 text-xs text-slate-500">
                Não há novas solicitações aguardando orçamento no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {openRequests.slice(0, 4).map((req) => (
                  <div key={req.id} className="p-4 space-y-2.5">
                    <div>
                      <div className="text-xs text-slate-500">
                        {req.desiredTechnology} · {req.desiredMaterial} ·{' '}
                        <span className="font-mono">{req.quantity} un.</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {req.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Cliente: {req.clientName} · Prazo: {formatDateBR(req.desiredDeadline)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('/parceiro/solicitacoes')}
                        className="flex-1 rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Análise 3D
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/parceiro/orcamentos?projeto=${req.id}`)
                        }
                        className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Elaborar Orçamento
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
