import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit3, Trash2, Check } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { Equipment, EquipmentStatus } from '../../models';
import { EquipmentService } from '../../services/domain.services';
import { formatCurrencyBRL } from '../../services/validation.util';
import {
  ConfirmModal,
  EmptyState,
  EQUIPMENT_STATUS_LABEL,
  EquipmentPhoto,
} from '../../shared/StatusHelpers';

export const PartnerEquipmentPage: React.FC = () => {
  const { currentUser, dataVersion, showToast } = useApp();
  const navigate = useNavigate();

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [hoursDraft, setHoursDraft] = useState<Record<string, number>>({});
  const [statusDraft, setStatusDraft] = useState<Record<string, EquipmentStatus>>({});
  const [deletingTarget, setDeletingTarget] = useState<Equipment | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const list = await EquipmentService.listByPartner(currentUser.id);
      if (active) {
        setEquipments(list);
        const hMap: Record<string, number> = {};
        const sMap: Record<string, EquipmentStatus> = {};
        list.forEach((e) => {
          hMap[e.id] = e.availableHours;
          sMap[e.id] = e.status;
        });
        setHoursDraft(hMap);
        setStatusDraft(sMap);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion]);

  const handleSaveAvailability = async (eq: Equipment) => {
    const nextHours = hoursDraft[eq.id] ?? eq.availableHours;
    const nextStatus = statusDraft[eq.id] ?? eq.status;
    await EquipmentService.updateIdleHours(eq.id, nextHours, nextStatus);
    showToast(
      'success',
      'Disponibilidade atualizada',
      `${eq.name}: ${nextHours}h ociosas (${EQUIPMENT_STATUS_LABEL[nextStatus].text}).`
    );
  };

  const handleDelete = async () => {
    if (!deletingTarget) return;
    await EquipmentService.delete(deletingTarget.id);
    showToast('info', 'Equipamento removido do seu catálogo');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Gerenciamento de Equipamentos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre suas impressoras 3D, atualize janelas de horas ociosas e configure
            os valores de hora-máquina publicados no Marketplace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/parceiro/equipamentos/novo')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" /> Novo Equipamento
        </button>
      </div>

      {equipments.length === 0 ? (
        <EmptyState
          title="Nenhum equipamento cadastrado em sua conta"
          description="Adicione sua primeira impressora 3D com materiais compatíveis e horas disponíveis para começar a receber solicitações."
          actionLabel="Cadastrar Primeiro Equipamento"
          onAction={() => navigate('/parceiro/equipamentos/novo')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {equipments.map((eq) => {
            const st = EQUIPMENT_STATUS_LABEL[eq.status];
            const StatusIcon = st.Icon;
            return (
              <div
                key={eq.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="sm:flex">
                    <div className="sm:w-44 shrink-0">
                      <EquipmentPhoto
                        src={eq.photos[0]}
                        alt={eq.name}
                        technology={eq.technology}
                        className="w-full h-44 sm:h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-semibold text-blue-700">
                          {eq.technology}
                        </span>
                        <span>·</span>
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${st.colorClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" /> {st.text}
                        </span>
                      </div>

                      <h2 className="mt-1 font-display text-base font-bold text-slate-900 truncate">
                        {eq.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {eq.manufacturer} · {eq.model} · {eq.location}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block">Volume</span>
                          <span className="font-mono tabular-nums text-slate-800 font-medium">
                            {eq.buildVolumeMm.x}×{eq.buildVolumeMm.y}×{eq.buildVolumeMm.z}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Precisão</span>
                          <span className="font-mono tabular-nums text-slate-800 font-medium">
                            {eq.precisionMicrons} µm
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Valor/hora</span>
                          <span className="font-mono tabular-nums text-slate-900 font-bold">
                            {formatCurrencyBRL(eq.hourlyRateBrl)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Availability & CRUD Bar */}
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-slate-600">Horas livres:</label>
                    <input
                      type="number"
                      min={0}
                      max={720}
                      value={hoursDraft[eq.id] ?? eq.availableHours}
                      onChange={(e) =>
                        setHoursDraft((prev) => ({
                          ...prev,
                          [eq.id]: Number(e.target.value),
                        }))
                      }
                      className="w-20 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono tabular-nums text-right"
                    />
                    <select
                      value={statusDraft[eq.id] ?? eq.status}
                      onChange={(e) =>
                        setStatusDraft((prev) => ({
                          ...prev,
                          [eq.id]: e.target.value as EquipmentStatus,
                        }))
                      }
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
                    >
                      {Object.values(EquipmentStatus).map((s) => (
                        <option key={s} value={s}>
                          {EQUIPMENT_STATUS_LABEL[s].text}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleSaveAvailability(eq)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" /> Salvar Horas
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/parceiro/equipamentos/novo?editar=${eq.id}`)
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTarget(eq)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deletingTarget)}
        title="Excluir equipamento do parque?"
        description={`Deseja remover "${deletingTarget?.name}" (${deletingTarget?.model}) permanentemente do seu catálogo no Marketplace?`}
        confirmLabel="Sim, excluir equipamento"
        danger
        onConfirm={() => void handleDelete()}
        onClose={() => setDeletingTarget(null)}
      />
    </div>
  );
};
