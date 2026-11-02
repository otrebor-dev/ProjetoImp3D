import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, FileSpreadsheet, FolderDown, X } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import { Project, ProjectFile, ProjectStatus } from '../../models';
import { ProjectService } from '../../services/domain.services';
import {
  formatBytes,
  formatDateBR,
  formatDateTimeBR,
} from '../../services/validation.util';
import {
  EmptyState,
  FileInspectionModal,
  PROJECT_STATUS_LABEL,
} from '../../shared/StatusHelpers';

export const PartnerRequestsPage: React.FC = () => {
  const { currentUser, dataVersion, showToast } = useApp();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>('OPEN_NEG');
  const [analyzingProject, setAnalyzingProject] = useState<Project | null>(null);
  const [inspectFile, setInspectFile] = useState<ProjectFile | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const list = await ProjectService.listForPartner(currentUser.id);
      if (active) {
        setProjects(list);
        if (analyzingProject) {
          setAnalyzingProject(
            list.find((item) => item.id === analyzingProject.id) || null
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion]);

  const filtered = projects.filter((p) => {
    if (filter === 'OPEN_NEG') {
      return (
        p.status === ProjectStatus.OPEN ||
        p.status === ProjectStatus.IN_NEGOTIATION
      );
    }
    return true;
  });

  const handleDownloadAll = async (project: Project) => {
    if (project.files.length === 0) return;
    await ProjectService.downloadAllProjectFiles(project.files);
    showToast(
      'info',
      'Download em lote iniciado',
      `${project.files.length} arquivo(s) do projeto "${project.title}" transferidos.`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Solicitações Recebidas & Análise Técnica 3D
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Inspecione a malha tridimensional (STL/OBJ/3MF), baixe os pacotes técnicos
          enviados pelos clientes e elabore propostas comerciais precisas.
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        <button
          type="button"
          onClick={() => setFilter('OPEN_NEG')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            filter === 'OPEN_NEG'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Disponíveis para cotação
        </button>
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Histórico completo
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação disponível neste filtro"
          description="Novas demandas publicadas por clientes da rede aparecerão automaticamente aqui."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((prj) => {
            const st = PROJECT_STATUS_LABEL[prj.status];
            const canQuote =
              prj.status === ProjectStatus.OPEN ||
              prj.status === ProjectStatus.IN_NEGOTIATION;

            return (
              <article
                key={prj.id}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">
                        {prj.desiredTechnology}
                      </span>
                      <span>·</span>
                      <span>Cliente: {prj.clientName}</span>
                      <span>·</span>
                      <span>Solicitado em {formatDateTimeBR(prj.createdAt)}</span>
                      <span>·</span>
                      <span className={`font-medium ${st.colorClass}`}>
                        {st.text}
                      </span>
                    </div>

                    <h2 className="mt-1.5 font-display text-lg font-bold text-slate-900">
                      {prj.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {prj.description}
                    </p>
                  </div>

                  <div className="md:text-right shrink-0 text-xs">
                    <div className="text-slate-400">Prazo desejado</div>
                    <div className="font-mono tabular-nums font-bold text-sm text-slate-900 mt-0.5">
                      {formatDateBR(prj.desiredDeadline)}
                    </div>
                    <div className="font-mono tabular-nums text-slate-500 mt-0.5">
                      Lote: {prj.quantity} peças
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">Material solicitado</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">
                      {prj.desiredMaterial}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cor / Acabamento</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">
                      {prj.desiredColor}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Envelope aprox.</span>
                    <span className="font-mono tabular-nums font-medium text-slate-800 mt-0.5 block">
                      {prj.dimensionsApproxMm}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pacote de arquivos</span>
                    <span className="font-mono tabular-nums font-medium text-slate-800 mt-0.5 block">
                      {prj.files.length} anexo(s)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAnalyzingProject(prj)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4 text-blue-600" /> Abrir Análise Técnica (
                      {prj.files.length} arquivos)
                    </button>

                    {prj.files.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleDownloadAll(prj)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        <FolderDown className="w-4 h-4" /> Baixar Todos os Arquivos
                      </button>
                    )}
                  </div>

                  {canQuote && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/parceiro/orcamentos?projeto=${prj.id}`)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Elaborar Orçamento
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Technical Analysis Modal (Section 9.4) */}
      {analyzingProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <div className="text-xs text-slate-500">
                  Mesa de Análise Técnica · Cliente: {analyzingProject.clientName}
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {analyzingProject.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAnalyzingProject(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {analyzingProject.technicalNotes && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-1">
                    Requisitos e Tolerâncias Informadas pelo Cliente:
                  </strong>
                  {analyzingProject.technicalNotes}
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900">
                  Lista de Arquivos do Projeto ({analyzingProject.files.length})
                </h4>
                {analyzingProject.files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleDownloadAll(analyzingProject)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                  >
                    <FolderDown className="w-3.5 h-3.5" /> Download completo do pacote
                  </button>
                )}
              </div>

              {analyzingProject.files.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Esta solicitação não possui arquivos anexados.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {analyzingProject.files.map((file) => {
                    const ext = file.extension.toUpperCase();
                    const supports3D = ['STL', 'OBJ', '3MF'].includes(ext);
                    return (
                      <div
                        key={file.id}
                        className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {file.fileName}
                          </div>
                          <div className="font-mono tabular-nums text-slate-500 mt-0.5">
                            Formato {ext} · {formatBytes(file.sizeBytes)} ·{' '}
                            {supports3D
                              ? 'Renderização 3D WebGL disponível'
                              : 'Visualização documental / download'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInspectFile(file)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {supports3D ? 'Visualizar 3D' : 'Visualizar'}
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
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAnalyzingProject(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const pid = analyzingProject.id;
                  setAnalyzingProject(null);
                  navigate(`/parceiro/orcamentos?projeto=${pid}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <FileSpreadsheet className="w-4 h-4" /> Avançar para Elaboração de
                Orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      <FileInspectionModal
        file={inspectFile}
        onClose={() => setInspectFile(null)}
      />
    </div>
  );
};
