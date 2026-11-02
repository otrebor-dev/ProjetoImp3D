import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Upload } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { EquipmentStatus, PrintTechnology } from '../../models';
import { EquipmentService } from '../../services/domain.services';
import {
  DEFAULT_EQUIPMENT_PHOTOS,
  MATERIAL_CATALOG,
} from '../../services/seed.service';
import { EQUIPMENT_STATUS_LABEL, EquipmentPhoto } from '../../shared/StatusHelpers';

export const EquipmentFormPage: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editar') || '';

  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [technology, setTechnology] = useState<PrintTechnology>(PrintTechnology.FDM);
  const [materials, setMaterials] = useState<string[]>(['PLA Pro Engenharia']);
  const [customMaterial, setCustomMaterial] = useState('');
  const [volX, setVolX] = useState(250);
  const [volY, setVolY] = useState(250);
  const [volZ, setVolZ] = useState(250);
  const [precisionMicrons, setPrecisionMicrons] = useState(100);
  const [availableHours, setAvailableHours] = useState(40);
  const [hourlyRateBrl, setHourlyRateBrl] = useState(55);
  const [location, setLocation] = useState(
    currentUser?.partnerProfile
      ? `${currentUser.partnerProfile.city}, ${currentUser.partnerProfile.state}`
      : 'São Paulo, SP'
  );
  const [status, setStatus] = useState<EquipmentStatus>(EquipmentStatus.AVAILABLE);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [description, setDescription] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    void (async () => {
      const existing = await EquipmentService.getById(editId);
      if (!existing) return;
      setName(existing.name);
      setManufacturer(existing.manufacturer);
      setModel(existing.model);
      setTechnology(existing.technology);
      setMaterials(existing.materials);
      setVolX(existing.buildVolumeMm.x);
      setVolY(existing.buildVolumeMm.y);
      setVolZ(existing.buildVolumeMm.z);
      setPrecisionMicrons(existing.precisionMicrons);
      setAvailableHours(existing.availableHours);
      setHourlyRateBrl(existing.hourlyRateBrl);
      setLocation(existing.location);
      setStatus(existing.status);
      setPhotoDataUrl(existing.photos[0] || '');
      setDescription(existing.description);
      setTechnicalNotes(existing.technicalNotes || '');
    })();
  }, [editId]);

  const toggleMaterial = (matName: string) => {
    setMaterials((prev) =>
      prev.includes(matName)
        ? prev.filter((m) => m !== matName)
        : [...prev, matName]
    );
  };

  const addCustomMaterial = () => {
    const trimmed = customMaterial.trim();
    if (!trimmed) return;
    if (!materials.includes(trimmed)) {
      setMaterials((prev) => [...prev, trimmed]);
    }
    setCustomMaterial('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const errors = {
    name: name.trim().length < 3 ? 'Informe o nome descritivo do equipamento.' : null,
    manufacturer: !manufacturer.trim() ? 'Informe o fabricante.' : null,
    model: !model.trim() ? 'Informe o modelo.' : null,
    materials:
      materials.length === 0 ? 'Selecione pelo menos 1 material compatível.' : null,
    hourlyRate:
      hourlyRateBrl <= 0 ? 'O valor por hora deve ser maior que zero.' : null,
    description:
      description.trim().length < 10
        ? 'Informe uma descrição técnica (mínimo 10 caracteres).'
        : null,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    if (hasErrors || !currentUser) return;

    setSaving(true);
    try {
      const photos = photoDataUrl
        ? [photoDataUrl]
        : [DEFAULT_EQUIPMENT_PHOTOS[technology]];

      if (editId) {
        await EquipmentService.update(editId, {
          name: name.trim(),
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          technology,
          materials,
          buildVolumeMm: { x: volX, y: volY, z: volZ },
          precisionMicrons,
          availableHours,
          hourlyRateBrl,
          location: location.trim(),
          status,
          photos,
          description: description.trim(),
          technicalNotes: technicalNotes.trim(),
        });
        showToast('success', 'Equipamento atualizado com sucesso');
      } else {
        await EquipmentService.create(currentUser, {
          name: name.trim(),
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          technology,
          materials,
          buildVolumeMm: { x: volX, y: volY, z: volZ },
          precisionMicrons,
          availableHours,
          hourlyRateBrl,
          location: location.trim(),
          status,
          photos,
          description: description.trim(),
          technicalNotes: technicalNotes.trim(),
        });
        showToast(
          'success',
          'Equipamento publicado no Marketplace',
          'Suas horas ociosas já estão visíveis para os clientes da rede.'
        );
      }
      navigate('/parceiro/equipamentos');
    } finally {
      setSaving(false);
    }
  };

  const activePreviewSrc = photoDataUrl || DEFAULT_EQUIPMENT_PHOTOS[technology];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          {editId ? 'Editar Equipamento 3D' : 'Cadastrar Novo Equipamento'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Disponibilize a capacidade produtiva e especificações dimensionais da sua
          impressora 3D no Marketplace ICM.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            01. Identificação e Tecnologia
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nome de exibição da célula / equipamento *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Impressora CoreXY Câmara Aquecida"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fabricante *
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Ex.: Ultimaker, EOS, Formlabs"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.manufacturer && (
                <p className="mt-1 text-xs text-red-600">{errors.manufacturer}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex.: S7 Pro"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.model && (
                <p className="mt-1 text-xs text-red-600">{errors.model}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tecnologia de impressão *
              </label>
              <select
                value={technology}
                onChange={(e) => setTechnology(e.target.value as PrintTechnology)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {Object.values(PrintTechnology).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Localização (Cidade, UF) *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status de disponibilidade
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {Object.values(EquipmentStatus).map((s) => (
                  <option key={s} value={s}>
                    {EQUIPMENT_STATUS_LABEL[s].text}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Parâmetros Produtivos */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            02. Envelope Construtivo, Precisão e Precificação Horária
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Eixo X (mm)
              </label>
              <input
                type="number"
                min={20}
                value={volX}
                onChange={(e) => setVolX(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Eixo Y (mm)
              </label>
              <input
                type="number"
                min={20}
                value={volY}
                onChange={(e) => setVolY(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Eixo Z (mm)
              </label>
              <input
                type="number"
                min={20}
                value={volZ}
                onChange={(e) => setVolZ(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Precisão (µm)
              </label>
              <input
                type="number"
                min={5}
                value={precisionMicrons}
                onChange={(e) => setPrecisionMicrons(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Horas ociosas
              </label>
              <input
                type="number"
                min={0}
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor/h (R$) *
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={hourlyRateBrl}
                onChange={(e) => setHourlyRateBrl(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
          </div>
          {submittedOnce && errors.hourlyRate && (
            <p className="text-xs text-red-600">{errors.hourlyRate}</p>
          )}

          {/* Materiais Compatíveis */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Materiais compatíveis habilitados *
            </label>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_CATALOG.map((mat) => {
                const selected = materials.includes(mat.name);
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => toggleMaterial(mat.name)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
                      selected
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mat.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={customMaterial}
                onChange={(e) => setCustomMaterial(e.target.value)}
                placeholder="Adicionar outro material específico..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={addCustomMaterial}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                + Incluir
              </button>
            </div>
            {submittedOnce && errors.materials && (
              <p className="mt-1 text-xs text-red-600">{errors.materials}</p>
            )}
          </div>
        </section>

        {/* Fotografia e Descrição */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            03. Fotografia e Memorial Técnico
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="sm:col-span-5">
              <EquipmentPhoto
                src={activePreviewSrc}
                alt="Prévia do equipamento"
                technology={technology}
                className="w-full h-44 object-cover rounded-lg border border-slate-200"
              />
            </div>
            <div className="sm:col-span-7 space-y-2">
              <div className="text-xs font-medium text-slate-800">
                Fotografia do equipamento
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Envie uma foto real da sua máquina instalada ou utilize a fotografia
                industrial de referência da tecnologia selecionada.
              </p>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Enviar foto do computador
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição técnica do equipamento *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva diferenciais da máquina, sistema de extrusão/laser, câmara aquecida e aplicações recomendadas..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
            {submittedOnce && errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações operacionais (pós-processamento incluso, tolerâncias, turnos)
            </label>
            <textarea
              rows={2}
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              placeholder="Ex.: Pós-cura UV e lavagem IPA inclusas."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/parceiro/equipamentos')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving
              ? 'Salvando...'
              : editId
              ? 'Salvar Alterações'
              : 'Publicar Equipamento'}
          </button>
        </div>
      </form>
    </div>
  );
};
