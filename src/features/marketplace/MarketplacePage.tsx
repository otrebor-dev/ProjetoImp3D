import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ArrowUpRight, Edit3 } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import {
  Equipment,
  EquipmentStatus,
  PrintTechnology,
  UserRole,
} from '../../models';
import { EquipmentService } from '../../services/domain.services';
import { MATERIAL_CATALOG } from '../../services/seed.service';
import { formatCurrencyBRL } from '../../services/validation.util';
import {
  EmptyState,
  EQUIPMENT_STATUS_LABEL,
  EquipmentPhoto,
} from '../../shared/StatusHelpers';

export const MarketplacePage: React.FC = () => {
  const { currentUser, dataVersion, showToast } = useApp();
  const navigate = useNavigate();

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [techFilter, setTechFilter] = useState<string>('ALL');
  const [materialFilter, setMaterialFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [quickHours, setQuickHours] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const list = await EquipmentService.listAll();
      if (active) {
        setEquipments(list);
        if (selectedEquipment) {
          const refreshed = list.find((e) => e.id === selectedEquipment.id) || null;
          setSelectedEquipment(refreshed);
          if (refreshed) setQuickHours(refreshed.availableHours);
        }
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [dataVersion]);

  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(equipments.map((e) => e.location))).sort();
    return locs;
  }, [equipments]);

  const uniqueMaterials = useMemo(() => {
    const set = new Set<string>(MATERIAL_CATALOG.map((m) => m.name));
    equipments.forEach((e) => e.materials.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [equipments]);

  const filteredEquipments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return equipments.filter((eq) => {
      if (q) {
        const hay =
          `${eq.name} ${eq.manufacturer} ${eq.model} ${eq.partnerName} ${eq.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (techFilter !== 'ALL' && eq.technology !== techFilter) return false;
      if (materialFilter !== 'ALL' && !eq.materials.includes(materialFilter)) {
        return false;
      }
      if (locationFilter !== 'ALL' && eq.location !== locationFilter) return false;
      if (availabilityFilter === 'AVAILABLE_ONLY') {
        if (
          eq.status !== EquipmentStatus.AVAILABLE &&
          eq.status !== EquipmentStatus.PARTIALLY_AVAILABLE
        ) {
          return false;
        }
        if (eq.availableHours <= 0) return false;
      } else if (
        availabilityFilter !== 'ALL' &&
        eq.status !== availabilityFilter
      ) {
        return false;
      }
      return true;
    });
  }, [
    equipments,
    searchTerm,
    techFilter,
    materialFilter,
    locationFilter,
    availabilityFilter,
  ]);

  const totalIdleHours = useMemo(
    () => filteredEquipments.reduce((acc, item) => acc + item.availableHours, 0),
    [filteredEquipments]
  );

  const isClient = currentUser?.role === UserRole.CLIENT;

  const clearFilters = () => {
    setSearchTerm('');
    setTechFilter('ALL');
    setMaterialFilter('ALL');
    setLocationFilter('ALL');
    setAvailabilityFilter('ALL');
  };

  const handleOpenDetail = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setQuickHours(eq.availableHours);
  };

  const handleQuickHoursSave = async () => {
    if (!selectedEquipment) return;
    await EquipmentService.updateIdleHours(selectedEquipment.id, quickHours);
    showToast(
      'success',
      'Disponibilidade atualizada',
      `Horas ociosas ajustadas para ${quickHours}h.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Mercado de Horas Ociosas de Impressão 3D
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consulte máquinas homologadas na rede, compare capacidade técnica disponível
            e solicite orçamentos sob demanda.
          </p>
        </div>

        <div className="text-right font-mono tabular-nums text-xs text-slate-600">
          <span className="font-semibold text-slate-900">
            {filteredEquipments.length}
          </span>{' '}
          equipamentos ·{' '}
          <span className="font-semibold text-blue-700">{totalIdleHours}h</span>{' '}
          ociosas ofertadas
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, modelo, fabricante ou parceiro..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              aria-label="Filtrar por tecnologia"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todas tecnologias</option>
              {Object.values(PrintTechnology).map((t) => (
                <option key={t} value={t}>
                  Tecnologia {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              aria-label="Filtrar por material"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todos materiais</option>
              {uniqueMaterials.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              aria-label="Filtrar por localização"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todas localizações</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Disponibilidade:
            </span>
            {[
              { id: 'ALL', label: 'Todos os status' },
              { id: 'AVAILABLE_ONLY', label: 'Com horas livres agora' },
              { id: EquipmentStatus.AVAILABLE, label: 'Disponível imediato' },
              { id: EquipmentStatus.PARTIALLY_AVAILABLE, label: 'Janela parcial' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAvailabilityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  availabilityFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(searchTerm ||
            techFilter !== 'ALL' ||
            materialFilter !== 'ALL' ||
            locationFilter !== 'ALL' ||
            availabilityFilter !== 'ALL') && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
            >
              Limpar filtros aplicados
            </button>
          )}
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-96 rounded-xl border border-slate-200 bg-white animate-pulse"
            />
          ))}
        </div>
      ) : filteredEquipments.length === 0 ? (
        <EmptyState
          title="Nenhum equipamento encontrado para este filtro"
          description="Ajuste a tecnologia, o material ou a região selecionada para visualizar outras células produtivas disponíveis."
          actionLabel="Restaurar filtros"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipments.map((eq) => {
            const st = EQUIPMENT_STATUS_LABEL[eq.status];
            const StatusIcon = st.Icon;
            const isOwnEquipment = currentUser?.id === eq.partnerId;

            return (
              <article
                key={eq.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <EquipmentPhoto
                    src={eq.photos[0]}
                    alt={`${eq.name} — ${eq.model}`}
                    technology={eq.technology}
                    className="w-full h-48 object-cover border-b border-slate-100"
                  />

                  <div className="p-5">
                    {/* Unboxed Metadata Kicker (Zero-Pill Discipline) */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">
                        {eq.technology}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{eq.location}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`inline-flex items-center gap-1 font-medium ${st.colorClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {st.text}
                      </span>
                    </div>

                    <h2 className="mt-2 font-display text-base font-bold text-slate-900 leading-snug">
                      {eq.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {eq.manufacturer} · Modelo {eq.model} · Parceiro:{' '}
                      <span className="font-medium text-slate-700">
                        {eq.partnerName}
                      </span>
                    </p>

                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {eq.description}
                    </p>

                    {/* Technical Metrics Row */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-400">Volume útil</div>
                        <div className="font-mono tabular-nums font-medium text-slate-800 mt-0.5">
                          {eq.buildVolumeMm.x}×{eq.buildVolumeMm.y}×{eq.buildVolumeMm.z}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Resolução</div>
                        <div className="font-mono tabular-nums font-medium text-slate-800 mt-0.5">
                          {eq.precisionMicrons} µm
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400">Horas livres</div>
                        <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                          {eq.availableHours}h
                        </div>
                      </div>
                    </div>

                    {/* Materials inline */}
                    <div className="mt-3 text-xs text-slate-500 truncate">
                      <span className="text-slate-400">Materiais: </span>
                      {eq.materials.join(' · ')}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500">Valor referência</div>
                    <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                      {formatCurrencyBRL(eq.hourlyRateBrl)}
                      <span className="text-xs font-normal text-slate-500"> / hora</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(eq)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      Detalhes
                    </button>

                    {isClient && eq.availableHours > 0 && eq.status !== EquipmentStatus.MAINTENANCE && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/cliente/nova-solicitacao?equipamento=${eq.id}`)
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Orçar <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isOwnEquipment && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/parceiro/equipamentos/novo?editar=${eq.id}`)
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                      >
                        <Edit3 className="w-3 h-3" /> Editar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detailed Equipment Inspection Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <div className="text-xs text-slate-500">
                  {selectedEquipment.technology} · {selectedEquipment.manufacturer} ·{' '}
                  {selectedEquipment.model}
                </div>
                <h3 className="text-lg font-bold text-slate-900 truncate">
                  {selectedEquipment.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEquipment(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Fechar detalhes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <EquipmentPhoto
                src={selectedEquipment.photos[0]}
                alt={selectedEquipment.name}
                technology={selectedEquipment.technology}
                className="w-full h-60 object-cover rounded-lg border border-slate-200"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Volume Máximo</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5 block">
                    {selectedEquipment.buildVolumeMm.x} ×{' '}
                    {selectedEquipment.buildVolumeMm.y} ×{' '}
                    {selectedEquipment.buildVolumeMm.z} mm
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Precisão / Camada</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5 block">
                    {selectedEquipment.precisionMicrons} mícrons
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Horas Ociosas</span>
                  <span className="font-mono tabular-nums font-semibold text-blue-700 mt-0.5 block">
                    {selectedEquipment.availableHours} horas
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hora-Máquina</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5 block">
                    {formatCurrencyBRL(selectedEquipment.hourlyRateBrl)}/h
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Parceiro Responsável & Localização
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    {selectedEquipment.partnerName} · Unidade em{' '}
                    {selectedEquipment.location}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Materiais Homologados neste Equipamento
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    {selectedEquipment.materials.join(' · ')}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Descrição e Observações Técnicas
                  </h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {selectedEquipment.description}
                  </p>
                  {selectedEquipment.technicalNotes && (
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Nota operacional: {selectedEquipment.technicalNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Idle Hours Control if Current User Owns Machine */}
              {currentUser?.id === selectedEquipment.partnerId && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Atualização rápida de horas ociosas (Seu equipamento)
                    </div>
                    <div className="text-xs text-slate-500">
                      Ajuste imediatamente a janela produtiva ofertada no marketplace.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={720}
                      value={quickHours}
                      onChange={(e) => setQuickHours(Number(e.target.value))}
                      className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono tabular-nums text-right"
                    />
                    <span className="text-xs text-slate-600">h</span>
                    <button
                      type="button"
                      onClick={() => void handleQuickHoursSave()}
                      className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedEquipment(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              >
                Fechar
              </button>

              {isClient &&
                selectedEquipment.availableHours > 0 &&
                selectedEquipment.status !== EquipmentStatus.MAINTENANCE && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedEquipment.id;
                      setSelectedEquipment(null);
                      navigate(`/cliente/nova-solicitacao?equipamento=${id}`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                  >
                    Solicitar Orçamento neste Equipamento{' '}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
