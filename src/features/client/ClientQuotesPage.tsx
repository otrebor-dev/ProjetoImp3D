import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { Quote, QuoteStatus } from '../../models';
import { QuoteService } from '../../services/domain.services';
import { formatCurrencyBRL, formatDateTimeBR } from '../../services/validation.util';
import {
  ConfirmModal,
  EmptyState,
  EscrowPaymentModal,
  QUOTE_STATUS_LABEL,
} from '../../shared/StatusHelpers';

export const ClientQuotesPage: React.FC = () => {
  const { currentUser, dataVersion, showToast } = useApp();
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [approvingQuote, setApprovingQuote] = useState<Quote | null>(null);
  const [rejectingQuote, setRejectingQuote] = useState<Quote | null>(null);
  const [submittingEscrow, setSubmittingEscrow] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const list = await QuoteService.listByClient(currentUser.id);
      if (active) setQuotes(list);
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion]);

  const visibleQuotes =
    filter === 'ALL' ? quotes : quotes.filter((q) => q.status === filter);

  const handleConfirmEscrow = async (
    method:
      | 'PIX Corporativo (Simulado)'
      | 'Boleto Escrow (Simulado)'
      | 'Cartão Empresarial (Simulado)'
  ) => {
    if (!currentUser || !approvingQuote) return;
    setSubmittingEscrow(true);
    try {
      const order = await QuoteService.approveQuoteWithEscrow(
        currentUser,
        approvingQuote.id,
        method
      );
      setApprovingQuote(null);
      showToast(
        'success',
        `Pedido ${order.code} criado com Escrow Simulado!`,
        'Redirecionando para a Central de Acompanhamento compartilhada.'
      );
      navigate(`/cliente/pedido/${order.id}`);
    } catch (err) {
      showToast(
        'error',
        'Erro ao aprovar proposta',
        err instanceof Error ? err.message : 'Tente novamente.'
      );
    } finally {
      setSubmittingEscrow(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingQuote) return;
    await QuoteService.rejectQuote(
      rejectingQuote.id,
      'Proposta declinada pelo cliente após análise comparativa.'
    );
    showToast('info', 'Orçamento recusado', 'O parceiro foi notificado da decisão.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Análise de Orçamentos Recebidos
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Compare propostas comerciais de parceiros fornecedores, prazos estimados,
          especificações técnicas e aprove com custódia em escrow simulado.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        {[
          { id: 'ALL', label: 'Todos recebidos' },
          { id: QuoteStatus.SENT, label: 'Aguardando decisão' },
          { id: QuoteStatus.APPROVED, label: 'Aprovados' },
          { id: QuoteStatus.REJECTED, label: 'Recusados' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleQuotes.length === 0 ? (
        <EmptyState
          title="Nenhum orçamento para exibir neste filtro"
          description="Assim que os parceiros analisarem os arquivos técnicos de suas solicitações, as propostas aparecerão aqui."
          actionLabel="Ver Minhas Solicitações"
          onAction={() => navigate('/cliente/solicitacoes')}
        />
      ) : (
        <div className="space-y-4">
          {visibleQuotes.map((q) => {
            const st = QUOTE_STATUS_LABEL[q.status];
            return (
              <article
                key={q.id}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {q.partnerName}
                      </span>
                      <span>·</span>
                      <span>Enviado em {formatDateTimeBR(q.createdAt)}</span>
                      <span>·</span>
                      <span className={`font-medium ${st.colorClass}`}>
                        {st.text}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      {q.projectTitle}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Equipamento proposto:{' '}
                      <span className="font-medium text-slate-800">
                        {q.equipmentName}
                      </span>{' '}
                      · Material:{' '}
                      <span className="font-medium text-slate-800">
                        {q.materialUsed}
                      </span>{' '}
                      · Lote: <span className="font-mono">{q.quantity} un.</span>
                    </p>
                  </div>

                  <div className="md:text-right shrink-0">
                    <div className="text-xs text-slate-500">Valor total da proposta</div>
                    <div className="font-mono tabular-nums text-2xl font-bold text-slate-900">
                      {formatCurrencyBRL(q.totalValueBrl)}
                    </div>
                    <div className="font-mono tabular-nums text-xs text-slate-500 mt-0.5">
                      Produção: {q.productionLeadDays}d + Entrega: {q.deliveryLeadDays}d (
                      {q.productionLeadDays + q.deliveryLeadDays} dias úteis)
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown Line */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3.5 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">Tempo estimado + Prep</span>
                    <span className="font-mono tabular-nums font-medium text-slate-800 mt-0.5 block">
                      {q.estimatedPrintHours}h + {q.prepHours}h (
                      {formatCurrencyBRL(q.hourlyRateBrl)}/h)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Custo de material</span>
                    <span className="font-mono tabular-nums font-medium text-slate-800 mt-0.5 block">
                      {formatCurrencyBRL(q.materialCostBrl)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Custo de operação</span>
                    <span className="font-mono tabular-nums font-medium text-slate-800 mt-0.5 block">
                      {formatCurrencyBRL(q.operationCostBrl)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Custos adicionais / frete</span>
                    <span className="font-mono tabular-nums font-medium text-slate-800 mt-0.5 block">
                      {formatCurrencyBRL(q.additionalCostsBrl)}
                    </span>
                  </div>
                </div>

                {q.technicalNotes && (
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Parecer técnico do parceiro:</strong>{' '}
                    {q.technicalNotes}
                  </div>
                )}

                {q.status === QuoteStatus.SENT && (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectingQuote(q)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" /> Recusar Orçamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovingQuote(q)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprovar Proposta & Reservar Escrow
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <EscrowPaymentModal
        quote={approvingQuote}
        submitting={submittingEscrow}
        onConfirm={(method) => void handleConfirmEscrow(method)}
        onClose={() => setApprovingQuote(null)}
      />

      <ConfirmModal
        open={Boolean(rejectingQuote)}
        title="Recusar proposta comercial?"
        description={`Tem certeza de que deseja recusar a proposta de ${rejectingQuote?.partnerName} no valor de ${formatCurrencyBRL(
          rejectingQuote?.totalValueBrl || 0
        )}?`}
        confirmLabel="Sim, recusar proposta"
        danger
        onConfirm={() => void handleConfirmReject()}
        onClose={() => setRejectingQuote(null)}
      />
    </div>
  );
};
