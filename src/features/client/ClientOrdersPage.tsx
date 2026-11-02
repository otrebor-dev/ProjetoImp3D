import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { Order, OrderStatus } from '../../models';
import { OrderService } from '../../services/domain.services';
import { formatCurrencyBRL, formatDateBR } from '../../services/validation.util';
import {
  EmptyState,
  ESCROW_STATUS_LABEL,
  ORDER_STATUS_LABEL,
} from '../../shared/StatusHelpers';

export const ClientOrdersPage: React.FC = () => {
  const { currentUser, dataVersion } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const list = await OrderService.listByClient(currentUser.id);
      if (active) setOrders(list);
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion]);

  const filtered = orders.filter((o) => {
    if (tab === 'ACTIVE') return o.currentStatus !== OrderStatus.COMPLETED_SHIPPED;
    if (tab === 'COMPLETED') return o.currentStatus === OrderStatus.COMPLETED_SHIPPED;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Meus Pedidos & Produção
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Acesse a Central de Acompanhamento compartilhada para visualizar a linha do
          tempo de fabricação, status do escrow e conversar com o parceiro.
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        {[
          { id: 'ALL' as const, label: 'Todos os pedidos' },
          { id: 'ACTIVE' as const, label: 'Em andamento' },
          { id: 'COMPLETED' as const, label: 'Concluídos' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              tab === item.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado nesta visão"
          description="Aprove um orçamento pendente para iniciar a reserva em garantia e o acompanhamento de produção."
          actionLabel="Ver Orçamentos Recebidos"
          onAction={() => navigate('/cliente/orcamentos')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((ord) => {
            const st = ORDER_STATUS_LABEL[ord.currentStatus];
            const esc = ESCROW_STATUS_LABEL[ord.paymentSimulation.status];
            return (
              <div
                key={ord.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-900">
                      {ord.code}
                    </span>
                    <span>·</span>
                    <span>Parceiro: {ord.partnerName}</span>
                    <span>·</span>
                    <span className={`font-semibold ${st.colorClass}`}>
                      {st.text}
                    </span>
                  </div>
                  <h2 className="font-display text-base font-bold text-slate-900 truncate">
                    {ord.projectTitle}
                  </h2>
                  <div className="text-xs text-slate-500">
                    {ord.technology} · {ord.material} ·{' '}
                    <span className="font-mono tabular-nums">{ord.quantity} un.</span> ·{' '}
                    <span className={esc.colorClass}>{esc.text}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0">
                  <div className="md:text-right">
                    <div className="font-mono tabular-nums text-base font-bold text-slate-900">
                      {formatCurrencyBRL(ord.totalValueBrl)}
                    </div>
                    <div className="font-mono tabular-nums text-xs text-slate-500">
                      Previsão: {formatDateBR(ord.estimatedDeliveryDate)}
                    </div>
                  </div>
                  <Link
                    to={`/cliente/pedido/${ord.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                  >
                    Central do Pedido <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
