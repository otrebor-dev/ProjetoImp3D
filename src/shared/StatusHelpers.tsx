import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Cpu,
  Download,
  FileText,
  Box,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  EquipmentStatus,
  OrderStatus,
  PaymentEscrowStatus,
  PrintTechnology,
  ProjectFile,
  ProjectStatus,
  Quote,
  QuoteStatus,
} from '../models';
import { ProjectService } from '../services/domain.services';
import { StorageService } from '../services/storage.service';
import {
  formatBytes,
  formatCurrencyBRL,
  formatDateTimeBR,
} from '../services/validation.util';
import { Model3DViewer } from './Model3DViewer';

export const EQUIPMENT_STATUS_LABEL: Record<
  EquipmentStatus,
  { text: string; colorClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  [EquipmentStatus.AVAILABLE]: {
    text: 'Disponível imediato',
    colorClass: 'text-emerald-700',
    Icon: CheckCircle2,
  },
  [EquipmentStatus.PARTIALLY_AVAILABLE]: {
    text: 'Janela parcial',
    colorClass: 'text-amber-700',
    Icon: Clock,
  },
  [EquipmentStatus.BUSY]: {
    text: 'Em ocupação total',
    colorClass: 'text-slate-600',
    Icon: Clock,
  },
  [EquipmentStatus.MAINTENANCE]: {
    text: 'Em manutenção preventiva',
    colorClass: 'text-red-700',
    Icon: AlertTriangle,
  },
};

export const PROJECT_STATUS_LABEL: Record<
  ProjectStatus,
  { text: string; colorClass: string }
> = {
  [ProjectStatus.OPEN]: { text: 'Aberta para propostas', colorClass: 'text-blue-700' },
  [ProjectStatus.IN_NEGOTIATION]: { text: 'Em negociação', colorClass: 'text-amber-700' },
  [ProjectStatus.APPROVED]: { text: 'Orçamento aprovado', colorClass: 'text-emerald-700' },
  [ProjectStatus.IN_PRODUCTION]: { text: 'Em produção', colorClass: 'text-blue-700' },
  [ProjectStatus.COMPLETED]: { text: 'Concluída', colorClass: 'text-emerald-700' },
  [ProjectStatus.CANCELLED]: { text: 'Cancelada', colorClass: 'text-red-700' },
};

export const QUOTE_STATUS_LABEL: Record<
  QuoteStatus,
  { text: string; colorClass: string }
> = {
  [QuoteStatus.DRAFT]: { text: 'Rascunho salvo', colorClass: 'text-slate-600' },
  [QuoteStatus.SENT]: { text: 'Aguardando decisão do cliente', colorClass: 'text-amber-700' },
  [QuoteStatus.APPROVED]: { text: 'Proposta aprovada', colorClass: 'text-emerald-700' },
  [QuoteStatus.REJECTED]: { text: 'Proposta recusada', colorClass: 'text-red-700' },
  [QuoteStatus.CANCELLED]: { text: 'Proposta cancelada', colorClass: 'text-slate-500' },
};

export const ORDER_STATUS_LABEL: Record<
  OrderStatus,
  { text: string; colorClass: string }
> = {
  [OrderStatus.WAITING_APPROVAL]: {
    text: 'Aguardando aprovação',
    colorClass: 'text-amber-700',
  },
  [OrderStatus.ESCROW_PAYMENT]: {
    text: 'Pagamento em escrow',
    colorClass: 'text-blue-700',
  },
  [OrderStatus.IN_PRODUCTION]: {
    text: 'Em produção',
    colorClass: 'text-blue-700',
  },
  [OrderStatus.QUALITY_CONTROL]: {
    text: 'Controle de qualidade',
    colorClass: 'text-amber-700',
  },
  [OrderStatus.PACKAGING]: {
    text: 'Embalagem',
    colorClass: 'text-slate-700',
  },
  [OrderStatus.COMPLETED_SHIPPED]: {
    text: 'Concluído/Enviado',
    colorClass: 'text-emerald-700',
  },
};

export const ESCROW_STATUS_LABEL: Record<
  PaymentEscrowStatus,
  { text: string; colorClass: string }
> = {
  [PaymentEscrowStatus.PENDING]: {
    text: 'Aguardando reserva',
    colorClass: 'text-amber-700',
  },
  [PaymentEscrowStatus.RESERVED_IN_ESCROW]: {
    text: 'Valor retido em garantia (Escrow Simulado)',
    colorClass: 'text-blue-700',
  },
  [PaymentEscrowStatus.RELEASED_TO_PARTNER]: {
    text: 'Liquidado e liberado ao parceiro (Simulado)',
    colorClass: 'text-emerald-700',
  },
  [PaymentEscrowStatus.REFUNDED]: {
    text: 'Estornado ao cliente (Simulado)',
    colorClass: 'text-slate-600',
  },
};

export const EquipmentPhoto: React.FC<{
  src?: string;
  alt: string;
  technology: PrintTechnology;
  className?: string;
}> = ({ src, alt, technology, className = 'w-full h-48 object-cover' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 border-b border-slate-200 ${className}`}
      >
        <Cpu className="w-8 h-8 text-slate-400 mb-1.5" />
        <span className="text-xs font-medium text-slate-600">
          Sistema Industrial {technology}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
      {description}
    </p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FILE INSPECTION & 3D VIEWER MODAL
// ============================================================================
export const FileInspectionModal: React.FC<{
  file: ProjectFile | null;
  rawBlob?: Blob | null;
  onClose: () => void;
}> = ({ file, rawBlob, onClose }) => {
  const [resolvedBlob, setResolvedBlob] = useState<Blob | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;
    let active = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setTextPreview(null);
    setResolvedBlob(null);
    setObjectUrl(null);

    (async () => {
      try {
        const blob =
          rawBlob || (await StorageService.getFileBlob(file.blobKey))?.blob || null;
        if (!active) return;
        setResolvedBlob(blob);

        if (blob) {
          const ext = file.extension.toUpperCase();
          if (['PNG', 'JPG', 'JPEG', 'WEBP', 'PDF'].includes(ext)) {
            createdUrl = URL.createObjectURL(blob);
            setObjectUrl(createdUrl);
          } else if (ext === 'TXT') {
            const txt = await blob.text();
            if (active) setTextPreview(txt);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [file, rawBlob]);

  if (!file) return null;

  const ext = file.extension.toUpperCase();
  const is3D = ['STL', 'OBJ', '3MF'].includes(ext);
  const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext);
  const isPdf = ext === 'PDF';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              Inspeção Técnica de Arquivo — {file.fileName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              Formato {ext} · {formatBytes(file.sizeBytes)} · Anexado em{' '}
              {formatDateTimeBR(file.uploadedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
            aria-label="Fechar visualização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-sm text-slate-500">
              Carregando arquivo do armazenamento local...
            </div>
          ) : is3D && resolvedBlob ? (
            <Model3DViewer
              blob={resolvedBlob}
              extension={ext}
              fileName={file.fileName}
            />
          ) : isImage && objectUrl ? (
            <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-4">
              <img
                src={objectUrl}
                alt={file.fileName}
                referrerPolicy="no-referrer"
                className="max-h-[420px] object-contain rounded"
              />
            </div>
          ) : isPdf && objectUrl ? (
            <iframe
              src={objectUrl}
              title={file.fileName}
              className="w-full h-[440px] rounded-lg border border-slate-200 bg-white"
            />
          ) : textPreview !== null ? (
            <pre className="rounded-lg border border-slate-200 bg-white p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
              {textPreview}
            </pre>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              {is3D ? (
                <Box className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              ) : (
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              )}
              <h4 className="text-sm font-semibold text-slate-900">
                Apresentação técnica simplificada ({ext})
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Arquivos paramétricos B-Rep ou vetoriais ({ext}) não possuem renderização
                direta em navegador sem conversão de malha, mas estão íntegros para
                download e abertura em software CAD/CAM.
              </p>
              <div className="mt-4 text-xs font-mono tabular-nums text-slate-600">
                {file.fileName} · {formatBytes(file.sizeBytes)}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-3.5">
          <span className="text-xs text-slate-500">
            {is3D
              ? 'Arraste com o botão esquerdo para orbitar, scroll para zoom e botão direito para mover.'
              : 'Arquivo armazenado localmente via IndexedDB.'}
          </span>
          <div className="flex items-center gap-2.5">
            {!rawBlob && (
              <button
                type="button"
                onClick={() => void ProjectService.triggerFileDownload(file)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Arquivo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ESCROW PAYMENT SIMULATION MODAL
// ============================================================================
export const EscrowPaymentModal: React.FC<{
  quote: Quote | null;
  submitting: boolean;
  onConfirm: (
    method:
      | 'PIX Corporativo (Simulado)'
      | 'Boleto Escrow (Simulado)'
      | 'Cartão Empresarial (Simulado)'
  ) => void;
  onClose: () => void;
}> = ({ quote, submitting, onConfirm, onClose }) => {
  const [method, setMethod] = useState<
    | 'PIX Corporativo (Simulado)'
    | 'Boleto Escrow (Simulado)'
    | 'Cartão Empresarial (Simulado)'
  >('PIX Corporativo (Simulado)');

  if (!quote) return null;

  const platformFee = Math.round(quote.totalValueBrl * 0.08 * 100) / 100;
  const partnerNet = Math.round((quote.totalValueBrl - platformFee) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Aprovação e Reserva em Garantia (Escrow Simulado)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {quote.projectTitle} · Parceiro: {quote.partnerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed">
            <strong>Aviso de Simulação Financeira:</strong> Esta etapa demonstra a lógica
            de custódia em garantia (Escrow) da ICM. Nenhuma cobrança bancária real é
            efetuada nesta versão sem backend.
          </div>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600">Equipamento alocado</span>
              <span className="font-medium text-slate-900 text-right max-w-[240px] truncate">
                {quote.equipmentName}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600">Prazo estimado total</span>
              <span className="font-mono tabular-nums text-slate-900">
                {quote.productionLeadDays + quote.deliveryLeadDays} dias úteis
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600">Repasse líquido ao parceiro (após entrega)</span>
              <span className="font-mono tabular-nums text-slate-700">
                {formatCurrencyBRL(partnerNet)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600">Taxa de custódia e mediação ICM (8%)</span>
              <span className="font-mono tabular-nums text-slate-700">
                {formatCurrencyBRL(platformFee)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 font-semibold text-slate-900">
              <span>Valor total reservado em Escrow</span>
              <span className="font-mono tabular-nums text-base text-blue-700">
                {formatCurrencyBRL(quote.totalValueBrl)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Modalidade demonstrativa de reserva
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  'PIX Corporativo (Simulado)',
                  'Boleto Escrow (Simulado)',
                  'Cartão Empresarial (Simulado)',
                ] as const
              ).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMethod(opt)}
                  className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                    method === opt
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt}</span>
                  <span className="text-[11px] text-slate-500">Confirmação instantânea</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onConfirm(method)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            {submitting ? 'Processando reserva...' : 'Confirmar Reserva e Gerar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};
