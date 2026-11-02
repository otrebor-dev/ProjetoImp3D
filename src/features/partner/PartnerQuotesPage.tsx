import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Save, Edit3, XCircle } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import {
  Equipment,
  Project,
  ProjectStatus,
  Quote,
  QuoteStatus,
} from '../../models';
import {
  EquipmentService,
  ProjectService,
  QuoteService,
} from '../../services/domain.services';
import { formatCurrencyBRL, formatDateTimeBR } from '../../services/validation.util';
import {
  ConfirmModal,
  EmptyState,
  QUOTE_STATUS_LABEL,
} from '../../shared/StatusHelpers';

export const PartnerQuotesPage: React.FC = () => {
  const { currentUser, dataVersion, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectParamId = searchParams.get('projeto') || '';

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Composer State
  const [composerOpen, setComposerOpen] = useState<boolean>(Boolean(projectParamId));
  const [editingQuoteId, setEditingQuoteId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectParamId);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [materialUsed, setMaterialUsed] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [estimatedPrintHours, setEstimatedPrintHours] = useState<number>(6);
  const [prepHours, setPrepHours] = useState<number>(1);
  const [hourlyRateBrl, setHourlyRateBrl] = useState<number>(60);
  const [materialCostBrl, setMaterialCostBrl] = useState<number>(120);
  const [operationCostBrl, setOperationCostBrl] = useState<number>(45);
  const [additionalCostsBrl, setAdditionalCostsBrl] = useState<number>(30);
  const [productionLeadDays, setProductionLeadDays] = useState<number>(4);
  const [deliveryLeadDays, setDeliveryLeadDays] = useState<number>(2);
  const [technicalNotes, setTechnicalNotes] = useState<string>('');

  const [cancellingQuote, setCancellingQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const [eq, prj, qt] = await Promise.all([
        EquipmentService.listByPartner(currentUser.id),
        ProjectService.listForPartner(currentUser.id),
        QuoteService.listByPartner(currentUser.id),
      ]);
      if (!active) return;
      setEquipments(eq);
      setProjects(prj);
      setQuotes(qt);

      if (projectParamId) {
        const targetPrj = prj.find((p) => p.id === projectParamId);
        if (targetPrj) {
          setComposerOpen(true);
          setSelectedProjectId(targetPrj.id);
          setQuantity(targetPrj.quantity);
          setMaterialUsed(targetPrj.desiredMaterial);

          const matchingEq =
            eq.find((m) => m.id === targetPrj.targetEquipmentId) ||
            eq.find((m) => m.technology === targetPrj.desiredTechnology) ||
            eq[0];
          if (matchingEq) {
            setSelectedEquipmentId(matchingEq.id);
            setHourlyRateBrl(matchingEq.hourlyRateBrl);
          }
        }
      } else if (eq[0] && !selectedEquipmentId) {
        setSelectedEquipmentId(eq[0].id);
        setHourlyRateBrl(eq[0].hourlyRateBrl);
        setMaterialUsed(eq[0].materials[0] || 'PLA Pro Engenharia');
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion, projectParamId]);

  const liveCalculation = useMemo(
    () =>
      QuoteService.calculateTotal({
        estimatedPrintHours,
        prepHours,
        hourlyRateBrl,
        materialCostBrl,
        operationCostBrl,
        additionalCostsBrl,
      }),
    [
      estimatedPrintHours,
      prepHours,
      hourlyRateBrl,
      materialCostBrl,
      operationCostBrl,
      additionalCostsBrl,
    ]
  );

  const quotableProjects = projects.filter(
    (p) =>
      p.status === ProjectStatus.OPEN ||
      p.status === ProjectStatus.IN_NEGOTIATION ||
      p.id === selectedProjectId
  );

  const handleOpenNewComposer = () => {
    setEditingQuoteId('');
    const firstPrj = quotableProjects[0];
    const firstEq = equipments[0];
    if (firstPrj) {
      setSelectedProjectId(firstPrj.id);
      setQuantity(firstPrj.quantity);
      setMaterialUsed(firstPrj.desiredMaterial);
    }
    if (firstEq) {
      setSelectedEquipmentId(firstEq.id);
      setHourlyRateBrl(firstEq.hourlyRateBrl);
    }
    setTechnicalNotes('');
    setComposerOpen(true);
  };

  const handleEditQuote = (q: Quote) => {
    setEditingQuoteId(q.id);
    setSelectedProjectId(q.projectId);
    setSelectedEquipmentId(q.equipmentId);
    setMaterialUsed(q.materialUsed);
    setQuantity(q.quantity);
    setEstimatedPrintHours(q.estimatedPrintHours);
    setPrepHours(q.prepHours);
    setHourlyRateBrl(q.hourlyRateBrl);
    setMaterialCostBrl(q.materialCostBrl);
    setOperationCostBrl(q.operationCostBrl);
    setAdditionalCostsBrl(q.additionalCostsBrl);
    setProductionLeadDays(q.productionLeadDays);
    setDeliveryLeadDays(q.deliveryLeadDays);
    setTechnicalNotes(q.technicalNotes);
    setComposerOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePersistQuote = async (sendNow: boolean) => {
    if (!currentUser) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    const equipment = equipments.find((e) => e.id === selectedEquipmentId);

    if (!project) {
      showToast('error', 'Selecione a solicitação do cliente.');
      return;
    }
    if (!equipment) {
      showToast(
        'error',
        'Cadastre ou selecione um equipamento válido antes de orçar.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await QuoteService.saveOrSendQuote(currentUser, {
        existingQuoteId: editingQuoteId || undefined,
        project,
        equipment,
        materialUsed: materialUsed.trim() || project.desiredMaterial,
        quantity,
        estimatedPrintHours,
        prepHours,
        hourlyRateBrl,
        materialCostBrl,
        operationCostBrl,
        additionalCostsBrl,
        productionLeadDays,
        deliveryLeadDays,
        technicalNotes,
        sendNow,
      });

      showToast(
        'success',
        sendNow ? 'Proposta enviada ao cliente!' : 'Rascunho de orçamento salvo',
        sendNow
          ? `Valor total de ${formatCurrencyBRL(
              liveCalculation.totalValueBrl
            )} encaminhado para ${project.clientName}.`
          : 'Você pode continuar editando antes de enviar.'
      );

      setComposerOpen(false);
      setEditingQuoteId('');
      setSearchParams({});
    } catch (err) {
      showToast(
        'error',
        'Erro ao salvar proposta',
        err instanceof Error ? err.message : 'Verifique os campos.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelProposal = async () => {
    if (!cancellingQuote) return;
    await QuoteService.cancelQuote(cancellingQuote.id);
    showToast('info', 'Proposta comercial cancelada');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Elaboração e Gestão de Orçamentos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Forme preços automaticamente a partir de tempo de máquina, preparação,
            insumo e operação. Edite ou cancele propostas enquanto não aprovadas.
          </p>
        </div>

        {!composerOpen && (
          <button
            type="button"
            onClick={handleOpenNewComposer}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
          >
            + Nova Proposta Comercial
          </button>
        )}
      </div>

      {/* Interactive Quote Calculator & Composer (Section 9.5) */}
      {composerOpen && (
        <section className="rounded-xl border border-blue-200 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingQuoteId
                  ? 'Editar Proposta Comercial'
                  : 'Elaborar Nova Proposta Comercial'}
              </h2>
              <p className="text-xs text-slate-500">
                O valor total é calculado automaticamente em tempo real conforme os
                parâmetros informados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setComposerOpen(false);
                setEditingQuoteId('');
                setSearchParams({});
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Fechar formulário
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Solicitação do cliente *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedProjectId(pid);
                  const found = projects.find((p) => p.id === pid);
                  if (found) {
                    setQuantity(found.quantity);
                    setMaterialUsed(found.desiredMaterial);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Selecione um projeto...</option>
                {quotableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.desiredTechnology} · {p.quantity} un. · {p.clientName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Equipamento alocado *
              </label>
              <select
                value={selectedEquipmentId}
                onChange={(e) => {
                  const eid = e.target.value;
                  setSelectedEquipmentId(eid);
                  const eq = equipments.find((item) => item.id === eid);
                  if (eq) {
                    setHourlyRateBrl(eq.hourlyRateBrl);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.technology} · {eq.availableHours}h livres ·{' '}
                    {formatCurrencyBRL(eq.hourlyRateBrl)}/h)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Material utilizado *
              </label>
              <input
                type="text"
                value={materialUsed}
                onChange={(e) => setMaterialUsed(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quantidade (peças)
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor por hora (R$/h)
              </label>
              <input
                type="number"
                min={1}
                value={hourlyRateBrl}
                onChange={(e) => setHourlyRateBrl(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Cost & Time Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Impressão (h)
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={estimatedPrintHours}
                onChange={(e) => setEstimatedPrintHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preparação (h)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={prepHours}
                onChange={(e) => setPrepHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Custo Material (R$)
              </label>
              <input
                type="number"
                min={0}
                value={materialCostBrl}
                onChange={(e) => setMaterialCostBrl(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Operação (R$)
              </label>
              <input
                type="number"
                min={0}
                value={operationCostBrl}
                onChange={(e) => setOperationCostBrl(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Adicionais / Frete (R$)
              </label>
              <input
                type="number"
                min={0}
                value={additionalCostsBrl}
                onChange={(e) => setAdditionalCostsBrl(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prazo produção (dias úteis)
              </label>
              <input
                type="number"
                min={1}
                value={productionLeadDays}
                onChange={(e) => setProductionLeadDays(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prazo entrega (dias úteis)
              </label>
              <input
                type="number"
                min={1}
                value={deliveryLeadDays}
                onChange={(e) => setDeliveryLeadDays(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observações técnicas da proposta
              </label>
              <input
                type="text"
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                placeholder="Parâmetros de fatiamento, pós-processamento incluso e garantia dimensional..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          {/* Automatic Summary Bar */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>
                Subtotal horas-máquina ({estimatedPrintHours + prepHours}h ×{' '}
                {formatCurrencyBRL(hourlyRateBrl)}):{' '}
                <strong className="font-mono text-slate-900">
                  {formatCurrencyBRL(liveCalculation.machineSubtotal)}
                </strong>
              </div>
              <div>
                Insumos + Operação + Adicionais:{' '}
                <strong className="font-mono text-slate-900">
                  {formatCurrencyBRL(
                    materialCostBrl + operationCostBrl + additionalCostsBrl
                  )}
                </strong>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-slate-500">
                Valor Total Calculado Automaticamente
              </div>
              <div className="font-mono tabular-nums text-2xl font-bold text-blue-700">
                {formatCurrencyBRL(liveCalculation.totalValueBrl)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handlePersistQuote(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Save className="w-4 h-4" /> Salvar Rascunho
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handlePersistQuote(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
            >
              <Send className="w-4 h-4" /> Enviar Orçamento ao Cliente
            </button>
          </div>
        </section>
      )}

      {/* Existing Partner Quotes List */}
      {quotes.length === 0 ? (
        <EmptyState
          title="Nenhuma proposta comercial elaborada"
          description="Analise uma solicitação aberta de cliente e clique em Elaborar Orçamento para enviar sua primeira proposta."
          actionLabel="Elaborar Proposta Agora"
          onAction={handleOpenNewComposer}
        />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const st = QUOTE_STATUS_LABEL[q.status];
            const editable =
              q.status === QuoteStatus.DRAFT || q.status === QuoteStatus.SENT;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Cliente: {q.clientName}</span>
                    <span>·</span>
                    <span>Atualizado em {formatDateTimeBR(q.updatedAt)}</span>
                    <span>·</span>
                    <span className={`font-semibold ${st.colorClass}`}>
                      {st.text}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 truncate">
                    {q.projectTitle}
                  </h3>
                  <div className="text-xs text-slate-600">
                    {q.equipmentName} · {q.materialUsed} ·{' '}
                    <span className="font-mono tabular-nums">
                      {q.estimatedPrintHours + q.prepHours}h totais
                    </span>{' '}
                    · Prazo: {q.productionLeadDays + q.deliveryLeadDays}d úteis
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className="font-mono tabular-nums text-lg font-bold text-slate-900">
                    {formatCurrencyBRL(q.totalValueBrl)}
                  </div>

                  {editable && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditQuote(q)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellingQuote(q)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 whitespace-nowrap"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(cancellingQuote)}
        title="Cancelar proposta comercial?"
        description={`Deseja cancelar a proposta enviada para "${cancellingQuote?.projectTitle}"?`}
        confirmLabel="Confirmar cancelamento"
        danger
        onConfirm={() => void handleCancelProposal()}
        onClose={() => setCancellingQuote(null)}
      />
    </div>
  );
};
