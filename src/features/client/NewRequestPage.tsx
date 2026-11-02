import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Trash2, Eye, Box, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { Equipment, PrintTechnology, ProjectFile } from '../../models';
import {
  EquipmentService,
  ProjectService,
  UploadedFileDraft,
} from '../../services/domain.services';
import { MATERIAL_CATALOG } from '../../services/seed.service';
import {
  generateSampleStlBlob,
  SampleCadKind,
} from '../../services/stl-generator.util';
import { formatBytes } from '../../services/validation.util';
import { FileInspectionModal } from '../../shared/StatusHelpers';

const ACCEPTED_EXTENSIONS = [
  'STL',
  'OBJ',
  '3MF',
  'STEP',
  'STP',
  'PDF',
  'PNG',
  'JPG',
  'JPEG',
  'DXF',
  'TXT',
];

export const NewRequestPage: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEqId = searchParams.get('equipamento') || '';

  const [targetEquipment, setTargetEquipment] = useState<Equipment | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(5);
  const [technology, setTechnology] = useState<PrintTechnology>(PrintTechnology.FDM);
  const [desiredMaterial, setDesiredMaterial] = useState('PLA Pro Engenharia');
  const [desiredColor, setDesiredColor] = useState('Preto Fosco');
  const [dimensionsApproxMm, setDimensionsApproxMm] = useState('');
  const [desiredDeadline, setDesiredDeadline] = useState(
    new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  );
  const [technicalNotes, setTechnicalNotes] = useState('');

  const [files, setFiles] = useState<(UploadedFileDraft & { id: string })[]>([]);
  const [previewDraft, setPreviewDraft] = useState<{
    meta: ProjectFile;
    blob: Blob;
  } | null>(null);

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!preselectedEqId) return;
    void (async () => {
      const eq = await EquipmentService.getById(preselectedEqId);
      if (eq) {
        setTargetEquipment(eq);
        setTechnology(eq.technology);
        if (eq.materials[0]) setDesiredMaterial(eq.materials[0]);
      }
    })();
  }, [preselectedEqId]);

  const compatibleMaterials = MATERIAL_CATALOG.filter((m) =>
    m.compatibleTechnologies.includes(technology)
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const acceptedDrafts: (UploadedFileDraft & { id: string })[] = [];
    for (const f of selected) {
      const ext = (f.name.split('.').pop() || '').toUpperCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        showToast(
          'error',
          `Formato .${ext.toLowerCase()} não suportado`,
          'Anexe arquivos STL, OBJ, 3MF, STEP, STP, PDF, PNG, JPG ou DXF.'
        );
        continue;
      }
      acceptedDrafts.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        fileName: f.name,
      });
    }

    setFiles((prev) => [...prev, ...acceptedDrafts]);
    e.target.value = '';
  };

  const handleAttachSampleCad = (kind: SampleCadKind) => {
    const generated = generateSampleStlBlob(kind);
    setFiles((prev) => [
      ...prev,
      {
        id: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file: generated.blob,
        fileName: generated.fileName,
      },
    ]);
    showToast(
      'info',
      'Modelo 3D STL anexado',
      `Arquivo "${generated.fileName}" gerado localmente. Clique em Inspecionar 3D para visualizar.`
    );
  };

  const openDraftPreview = (item: UploadedFileDraft & { id: string }) => {
    const ext = (item.fileName.split('.').pop() || 'BIN').toUpperCase();
    setPreviewDraft({
      blob: item.file,
      meta: {
        id: item.id,
        projectId: 'draft',
        fileName: item.fileName,
        extension: ext,
        mimeType: item.file.type || 'application/octet-stream',
        sizeBytes: item.file.size,
        blobKey: '',
        uploadedByUserId: currentUser?.id || '',
        uploadedAt: new Date().toISOString(),
        category: 'ORIGINAL_CAD',
      },
    });
  };

  const errors = {
    title:
      title.trim().length < 4
        ? 'Informe o nome do projeto (mínimo 4 caracteres).'
        : null,
    description:
      description.trim().length < 10
        ? 'Descreva a finalidade e requisitos da peça (mínimo 10 caracteres).'
        : null,
    quantity: quantity < 1 ? 'A quantidade deve ser de pelo menos 1 unidade.' : null,
    dimensions:
      !dimensionsApproxMm.trim()
        ? 'Informe as dimensões aproximadas (ex.: 120 x 80 x 45 mm).'
        : null,
    deadline: !desiredDeadline ? 'Selecione o prazo desejado.' : null,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    if (hasErrors || !currentUser) return;

    setSubmitting(true);
    try {
      await ProjectService.createProject(
        currentUser,
        {
          title,
          description,
          quantity,
          desiredMaterial,
          desiredColor,
          dimensionsApproxMm,
          desiredTechnology: technology,
          desiredDeadline,
          technicalNotes,
          targetEquipmentId: targetEquipment?.id,
          targetPartnerId: targetEquipment?.partnerId,
        },
        files
      );
      showToast(
        'success',
        'Solicitação publicada com sucesso',
        'Os parceiros compatíveis já podem analisar os arquivos e enviar orçamentos.'
      );
      navigate('/cliente/solicitacoes');
    } catch (err) {
      showToast(
        'error',
        'Falha ao cadastrar solicitação',
        err instanceof Error ? err.message : 'Verifique os dados informados.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Nova Solicitação de Impressão 3D
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Especifique os parâmetros dimensionais, materiais e anexe seus modelos CAD 3D
          ou desenhos técnicos para cotação na rede.
        </p>
      </div>

      {targetEquipment && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-900">
              Solicitação direcionada ao equipamento selecionado no Marketplace:
            </div>
            <div className="text-sm font-medium text-slate-900 mt-0.5">
              {targetEquipment.name} ({targetEquipment.model}) · Parceiro:{' '}
              {targetEquipment.partnerName}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTargetEquipment(null)}
            className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
          >
            Abrir para todos os parceiros
          </button>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
        {/* Dados Principais */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            01. Especificações do Projeto e Lote
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-9">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nome do projeto *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Carcaça Frontal Sensor Lidar V2"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quantidade de peças *
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.quantity && (
                <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição funcional do projeto *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a aplicação mecânica, esforços envolvidos, ambiente de uso e exigências de acabamento superficial..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            {submittedOnce && errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tecnologia desejada *
              </label>
              <select
                value={technology}
                onChange={(e) => {
                  const nextTech = e.target.value as PrintTechnology;
                  setTechnology(nextTech);
                  const firstMat = MATERIAL_CATALOG.find((m) =>
                    m.compatibleTechnologies.includes(nextTech)
                  );
                  if (firstMat) {
                    setDesiredMaterial(firstMat.name);
                    setDesiredColor(firstMat.colorOptions[0] || 'Padrão');
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
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
                Material desejado *
              </label>
              <select
                value={desiredMaterial}
                onChange={(e) => setDesiredMaterial(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {(compatibleMaterials.length > 0
                  ? compatibleMaterials
                  : MATERIAL_CATALOG
                ).map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cor / Acabamento desejado
              </label>
              <input
                type="text"
                value={desiredColor}
                onChange={(e) => setDesiredColor(e.target.value)}
                placeholder="Ex.: Preto Fosco, Natural"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dimensões aproximadas (X × Y × Z mm) *
              </label>
              <input
                type="text"
                value={dimensionsApproxMm}
                onChange={(e) => setDimensionsApproxMm(e.target.value)}
                placeholder="Ex.: 95 x 60 x 42 mm"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.dimensions && (
                <p className="mt-1 text-xs text-red-600">{errors.dimensions}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prazo desejado para recebimento *
              </label>
              <input
                type="date"
                value={desiredDeadline}
                onChange={(e) => setDesiredDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              {submittedOnce && errors.deadline && (
                <p className="mt-1 text-xs text-red-600">{errors.deadline}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações técnicas (preenchimento, tolerâncias ISO, roscas, insertos)
            </label>
            <textarea
              rows={2}
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              placeholder="Ex.: Infill mínimo 40% Gyroid, tolerância ±0,2 mm nos furos passantes M4."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </section>

        {/* Upload de Arquivos CAD / Especificações */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                02. Upload de Modelos 3D e Desenhos Técnicos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formatos aceitos: STL, OBJ, 3MF (com visualização 3D interativa), STEP,
                STP, DXF, PDF, PNG e JPG.
              </p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-50 px-6 py-8 cursor-pointer transition-colors text-center">
            <Upload className="w-7 h-7 text-blue-600 mb-2" />
            <span className="text-sm font-semibold text-slate-900">
              Clique para selecionar múltiplos arquivos do computador
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Armazenamento binário local seguro via IndexedDB
            </span>
            <input
              type="file"
              multiple
              accept=".stl,.obj,.3mf,.step,.stp,.pdf,.png,.jpg,.jpeg,.dxf,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          {/* Geradores Rápidos de Peças STL para Demonstração */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500">
              Sem arquivo CAD em mãos? Anexe uma geometria STL real de teste:
            </span>
            <button
              type="button"
              onClick={() => handleAttachSampleCad('bracket')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <Box className="w-3.5 h-3.5 text-blue-600" /> + Suporte Mancal (.STL)
            </button>
            <button
              type="button"
              onClick={() => handleAttachSampleCad('gear')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <Box className="w-3.5 h-3.5 text-blue-600" /> + Engrenagem 20Z (.STL)
            </button>
            <button
              type="button"
              onClick={() => handleAttachSampleCad('impeller_housing')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <Box className="w-3.5 h-3.5 text-blue-600" /> + Difusor Aletado (.STL)
            </button>
          </div>

          {files.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {files.map((item) => {
                const ext = (item.fileName.split('.').pop() || '').toUpperCase();
                const is3D = ['STL', 'OBJ', '3MF'].includes(ext);
                return (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {item.fileName}
                      </div>
                      <div className="font-mono tabular-nums text-slate-500 mt-0.5">
                        Formato {ext} · {formatBytes(item.file.size)}
                        {is3D ? ' · Suporte Visualização 3D ativo' : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openDraftPreview(item)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {is3D ? 'Inspecionar 3D' : 'Visualizar'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) => prev.filter((f) => f.id !== item.id))
                        }
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                        aria-label="Remover anexo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/cliente/solicitacoes')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Enviando solicitação...' : 'Publicar Solicitação de Impressão'}
          </button>
        </div>
      </form>

      <FileInspectionModal
        file={previewDraft?.meta || null}
        rawBlob={previewDraft?.blob || null}
        onClose={() => setPreviewDraft(null)}
      />
    </div>
  );
};
