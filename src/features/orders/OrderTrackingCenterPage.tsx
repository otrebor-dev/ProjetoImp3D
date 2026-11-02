import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Send,
  ShieldCheck,
  Download,
  Eye,
  Upload,
  FileText,
  Truck,
} from 'lucide-react';
import { useApp } from '../../core/AppContext';
import {
  Message,
  Order,
  OrderStatus,
  Project,
  ProjectFile,
  Quote,
  UserRole,
} from '../../models';
import {
  MessageService,
  ORDER_STAGE_SEQUENCE,
  OrderService,
  ProjectService,
} from '../../services/domain.services';
import { StorageService } from '../../services/storage.service';
import {
  formatBytes,
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
} from '../../services/validation.util';
import {
  EmptyState,
  ESCROW_STATUS_LABEL,
  FileInspectionModal,
  ORDER_STATUS_LABEL,
} from '../../shared/StatusHelpers';

export const OrderTrackingCenterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, dataVersion, showToast } = useApp();

  const [order, setOrder] = useState<Order | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'DOCUMENTS' | 'ESCROW'>(
    'TIMELINE'
  );

  // Partner Operational Transition Form
  const [stageNote, setStageNote] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [advancing, setAdvancing] = useState(false);

  // Chat State
  const [chatText, setChatText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // File Inspection
  const [inspectFile, setInspectFile] = useState<ProjectFile | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const ord = await OrderService.getById(id);
      if (!active) return;
      if (!ord) {
        setOrder(null);
        setLoading(false);
        return;
      }

      const [prj, qt, msgs] = await Promise.all([
        ProjectService.getById(ord.projectId),
        StorageService.getById<Quote>('quotes', ord.quoteId),
        MessageService.listByOrder(ord.id, ord.projectId),
      ]);

      if (!active) return;
      setOrder(ord);
      setProject(prj || null);
      setQuote(qt || null);
      setMessages(msgs);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [id, dataVersion]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Carregando Central de Acompanhamento...
      </div>
    );
  }

  if (!order || !currentUser) {
    return (
      <EmptyState
        title="Pedido não encontrado"
        description="Verifique o código do pedido ou retorne à listagem de pedidos da sua conta."
      />
    );
  }

  const isPartnerOwner =
    currentUser.role === UserRole.PARTNER && currentUser.id === order.partnerId;
  const backPath =
    currentUser.role === UserRole.CLIENT ? '/cliente/pedidos' : '/parceiro/pedidos';

  const currentStageIndex = ORDER_STAGE_SEQUENCE.findIndex(
    (s) => s.status === order.currentStatus
  );
  const nextAllowedStage = OrderService.getNextAllowedStage(order.currentStatus);

  const handleAdvanceStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextAllowedStage || !isPartnerOwner) return;

    if (
      nextAllowedStage.status === OrderStatus.COMPLETED_SHIPPED &&
      !stageNote.trim() &&
      !trackingInput.trim()
    ) {
      showToast(
        'error',
        'Informe os dados de expedição',
        'Adicione o código de rastreio ou nota de disponibilização para concluir o pedido.'
      );
      return;
    }

    setAdvancing(true);
    try {
      await OrderService.advanceOrderStatus({
        orderId: order.id,
        actor: currentUser,
        nextStatus: nextAllowedStage.status,
        description: stageNote || nextAllowedStage.helperText,
        trackingCode: trackingInput || undefined,
      });
      setStageNote('');
      setTrackingInput('');
      showToast(
        'success',
        `Etapa atualizada: ${nextAllowedStage.label}`,
        nextAllowedStage.status === OrderStatus.COMPLETED_SHIPPED
          ? 'Operação finalizada e liquidação do escrow simulado registrada.'
          : 'O cliente já visualiza esta atualização na linha do tempo.'
      );
    } catch (err) {
      showToast(
        'error',
        'Não foi possível avançar etapa',
        err instanceof Error ? err.message : 'Verifique a sequência.'
      );
    } finally {
      setAdvancing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    setSendingMsg(true);
    try {
      await MessageService.sendMessage({
        order,
        sender: currentUser,
        content: chatText,
      });
      setChatText('');
    } catch (err) {
      showToast(
        'error',
        'Erro ao enviar mensagem',
        err instanceof Error ? err.message : 'Tente novamente.'
      );
    } finally {
      setSendingMsg(false);
    }
  };

  const handleComplementaryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await OrderService.attachComplementaryFile(order.id, currentUser, file);
    showToast(
      'success',
      'Documento complementar anexado',
      `"${file.name}" está disponível na aba Documentos & 3D.`
    );
    e.target.value = '';
  };

  const handleDownloadEscrowReceipt = () => {
    const pay = order.paymentSimulation;
    const content = [
      '============================================================',
      'ICM — COMPROVANTE DEMONSTRATIVO DE CUSTÓDIA ESCROW (SIMULADO)',
      '============================================================',
      `Pedido: ${order.code}`,
      `Projeto: ${order.projectTitle}`,
      `Cliente: ${order.clientName}`,
      `Parceiro Fornecedor: ${order.partnerName}`,
      `Código da Transação Simulada: ${pay.transactionCode}`,
      `Modalidade: ${pay.simulatedMethod}`,
      `Valor Total Reservado: ${formatCurrencyBRL(pay.amountBrl)}`,
      `Taxa de Intermediação ICM (8%): ${formatCurrencyBRL(pay.platformFeeBrl)}`,
      `Valor Líquido Parceiro: ${formatCurrencyBRL(pay.partnerNetBrl)}`,
      `Status Atual: ${ESCROW_STATUS_LABEL[pay.status].text}`,
      `Data da Reserva: ${formatDateTimeBR(pay.reservedAt || order.createdAt)}`,
      pay.releasedAt
        ? `Data da Liquidação Final: ${formatDateTimeBR(pay.releasedAt)}`
        : 'Liquidação: Pendente de conclusão/envio do lote',
      '------------------------------------------------------------',
      `AVISO LEGAL: ${pay.disclaimer}`,
      '============================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprovante_escrow_${order.code.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  const statusMeta = ORDER_STATUS_LABEL[order.currentStatus];
  const escrowMeta = ESCROW_STATUS_LABEL[order.paymentSimulation.status];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Order Header */}
      <div className="space-y-3">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para listagem de pedidos
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-bold text-slate-900">
                Pedido {order.code}
              </span>
              <span>·</span>
              <span>Cliente: {order.clientName}</span>
              <span>·</span>
              <span>Parceiro: {order.partnerName}</span>
              <span>·</span>
              <span className={`font-semibold ${statusMeta.colorClass}`}>
                Etapa atual: {statusMeta.text}
              </span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              {order.projectTitle}
            </h1>

            <div className="text-xs text-slate-600">
              Equipamento: <span className="font-medium">{order.equipmentName}</span> ·{' '}
              {order.technology} · {order.material} ·{' '}
              <span className="font-mono tabular-nums">{order.quantity} peças</span>
              {order.trackingCode && (
                <>
                  {' '}
                  ·{' '}
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700">
                    <Truck className="w-3.5 h-3.5" /> Rastreio: {order.trackingCode}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div>
              <div className="text-xs text-slate-500">Previsão de entrega</div>
              <div className="font-mono tabular-nums text-sm font-bold text-slate-900 mt-0.5">
                {formatDateBR(order.estimatedDeliveryDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Custódia financeira</div>
              <div className="font-mono tabular-nums text-lg font-bold text-blue-700 mt-0.5">
                {formatCurrencyBRL(order.totalValueBrl)}
              </div>
              <div className={`text-[11px] font-medium ${escrowMeta.colorClass}`}>
                {escrowMeta.text}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid: Left (Timeline / Docs / Escrow Tabs) + Right (Live Synchronized Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
            {[
              { id: 'TIMELINE' as const, label: 'Linha do Tempo Operacional' },
              {
                id: 'DOCUMENTS' as const,
                label: `Documentos & Modelos 3D (${
                  (project?.files.length || 0) + order.complementaryFiles.length
                })`,
              },
              { id: 'ESCROW' as const, label: 'Fluxo Financeiro (Escrow)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'TIMELINE' && (
            <div className="space-y-6">
              {/* Partner Action Card to Advance Operational Stage */}
              {isPartnerOwner && nextAllowedStage && (
                <form
                  onSubmit={(e) => void handleAdvanceStage(e)}
                  className="rounded-xl border border-blue-200 bg-white p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-blue-700">
                        Controle Operacional do Parceiro
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                        Avançar pedido para: "{nextAllowedStage.label}"
                      </h2>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Registro técnico da movimentação (visível ao cliente)
                    </label>
                    <textarea
                      rows={2}
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder={`Ex.: ${nextAllowedStage.helperText}`}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  {nextAllowedStage.status === OrderStatus.COMPLETED_SHIPPED && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Código de rastreio logístico / protocolo de entrega *
                      </label>
                      <input
                        type="text"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        placeholder="Ex.: BR-SEDEX-9938120-SP ou Retirada Balcão"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={advancing}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {advancing
                        ? 'Registrando etapa...'
                        : `Confirmar avanço para ${nextAllowedStage.label}`}
                    </button>
                  </div>
                </form>
              )}

              {/* Visual 6-Stage Timeline (Section 10.1) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-5">
                  Progresso da Operação (6 Etapas)
                </h2>

                <ol className="space-y-5">
                  {ORDER_STAGE_SEQUENCE.map((stage, idx) => {
                    const isCompleted =
                      idx < currentStageIndex ||
                      (idx === currentStageIndex &&
                        order.currentStatus === OrderStatus.COMPLETED_SHIPPED);
                    const isCurrent =
                      idx === currentStageIndex &&
                      order.currentStatus !== OrderStatus.COMPLETED_SHIPPED;
                    const isPending = idx > currentStageIndex;

                    const logEntry = [...order.timeline]
                      .reverse()
                      .find((entry) => entry.status === stage.status);

                    return (
                      <li key={stage.status} className="flex items-start gap-3.5">
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : isCurrent ? (
                            <Clock className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm ${
                                  isCurrent
                                    ? 'font-bold text-blue-700'
                                    : isCompleted
                                    ? 'font-semibold text-slate-900'
                                    : 'font-medium text-slate-400'
                                }`}
                              >
                                {idx + 1}. {stage.label}
                              </span>
                              <span className="text-xs text-slate-500">
                                ·{' '}
                                {isCompleted
                                  ? 'Concluída'
                                  : isCurrent
                                  ? 'Etapa atual'
                                  : 'Pendente'}
                              </span>
                            </div>

                            {logEntry && (
                              <span className="font-mono tabular-nums text-xs text-slate-500">
                                {formatDateTimeBR(logEntry.timestamp)}
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-xs leading-relaxed ${
                              isPending ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {logEntry ? logEntry.description : stage.helperText}
                          </p>

                          {logEntry && (
                            <div className="mt-1 text-[11px] text-slate-400">
                              Responsável: {logEntry.updatedByName} (
                              {logEntry.updatedByRole === UserRole.CLIENT
                                ? 'Cliente'
                                : 'Parceiro'}
                              )
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </div>
          )}

          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-6">
              {/* Original CAD & Specs */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Arquivos Originais do Projeto ({project?.files.length || 0})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Modelos 3D e memoriais enviados pelo cliente na abertura da
                      solicitação.
                    </p>
                  </div>
                </div>

                {!project || project.files.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Nenhum arquivo original anexado.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {project.files.map((file) => {
                      const is3D = ['STL', 'OBJ', '3MF'].includes(
                        file.extension.toUpperCase()
                      );
                      return (
                        <div
                          key={file.id}
                          className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {file.fileName}
                            </div>
                            <div className="font-mono tabular-nums text-slate-500">
                              {file.extension} · {formatBytes(file.sizeBytes)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setInspectFile(file)}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {is3D ? 'Inspecionar 3D' : 'Abrir'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void ProjectService.triggerFileDownload(file)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5" /> Baixar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Complementary Files & Quality Reports */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Arquivos Complementares & Laudos de Produção (
                      {order.complementaryFiles.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Anexe fotos de controle dimensional, certificados de lote ou
                      instruções adicionais.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" /> Anexar Documento
                    <input
                      type="file"
                      onChange={(e) => void handleComplementaryUpload(e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {order.complementaryFiles.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Nenhum documento complementar anexado até o momento.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {order.complementaryFiles.map((file) => (
                      <div
                        key={file.id}
                        className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {file.fileName}
                          </div>
                          <div className="font-mono tabular-nums text-slate-500">
                            {file.extension} · {formatBytes(file.sizeBytes)} ·{' '}
                            {formatDateTimeBR(file.uploadedAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInspectFile(file)}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Visualizar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void ProjectService.triggerFileDownload(file)
                            }
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Baixar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Approved Quote Summary */}
              {quote && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Orçamento Comercial Aprovado
                  </h2>
                  <div className="divide-y divide-slate-100 text-xs">
                    {quote.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-center justify-between gap-4"
                      >
                        <span className="text-slate-600">{item.description}</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrencyBRL(item.subtotalBrl)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 flex items-center justify-between font-semibold text-sm text-slate-900">
                      <span>Total contratado</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrencyBRL(quote.totalValueBrl)}
                      </span>
                    </div>
                  </div>
                  {quote.technicalNotes && (
                    <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                      Observações acordadas: {quote.technicalNotes}
                    </p>
                  )}
                </section>
              )}
            </div>
          )}

          {activeTab === 'ESCROW' && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Demonstrativo Financeiro de Pagamento em Escrow
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Protocolo: {order.paymentSimulation.transactionCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadEscrowReceipt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" /> Baixar Comprovante (.TXT)
                </button>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed">
                <strong>Aviso Importante:</strong> {order.paymentSimulation.disclaimer}
              </div>

              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-4 py-2 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Modalidade selecionada</span>
                  <span className="font-medium text-slate-900">
                    {order.paymentSimulation.simulatedMethod}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Situação da custódia</span>
                  <span className={`font-semibold ${escrowMeta.colorClass}`}>
                    {escrowMeta.text}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Valor bruto depositado</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {formatCurrencyBRL(order.paymentSimulation.amountBrl)}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Taxa plataforma ICM (8%)</span>
                  <span className="font-mono tabular-nums text-slate-700">
                    {formatCurrencyBRL(order.paymentSimulation.platformFeeBrl)}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Repasse líquido ao parceiro</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-700">
                    {formatCurrencyBRL(order.paymentSimulation.partnerNetBrl)}
                  </span>
                </div>
                {order.paymentSimulation.reservedAt && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Data da reserva em garantia</span>
                    <span className="font-mono tabular-nums text-slate-700">
                      {formatDateTimeBR(order.paymentSimulation.reservedAt)}
                    </span>
                  </div>
                )}
                {order.paymentSimulation.releasedAt && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Data da liberação final</span>
                    <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                      {formatDateTimeBR(order.paymentSimulation.releasedAt)}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right 5 Columns: Dedicated Order Chat (Section 10.3) */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white flex flex-col h-[560px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Canal Técnico Cliente ↔ Parceiro
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mensagens vinculadas diretamente ao pedido {order.code}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-6 text-xs text-slate-500">
                Nenhuma mensagem enviada ainda neste pedido. Utilize o campo abaixo para
                alinhar detalhes de fabricação, acabamento ou envio.
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                const isMsgClient = msg.senderRole === UserRole.CLIENT;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMine ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
                      <span className="font-semibold text-slate-700">
                        {msg.senderName}
                      </span>
                      <span>·</span>
                      <span>{isMsgClient ? 'Cliente' : 'Parceiro'}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {formatDateTimeBR(msg.createdAt)}
                      </span>
                    </div>

                    <div
                      className={`max-w-[86%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isMine
                          ? 'bg-blue-600 text-white'
                          : isMsgClient
                          ? 'bg-white border border-slate-200 text-slate-800'
                          : 'bg-slate-900 text-slate-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={(e) => void handleSendMessage(e)}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Escreva uma mensagem sobre a produção..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatText.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          </form>
        </section>
      </div>

      <FileInspectionModal
        file={inspectFile}
        onClose={() => setInspectFile(null)}
      />
    </div>
  );
};
