import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, PlusCircle, X } from 'lucide-react';
import { useApp } from '../../core/AppContext';
import {
  Order,
  Project,
  ProjectFile,
  ProjectStatus,
  Quote,
} from '../../models';
import {
  OrderService,
  ProjectService,
  QuoteService,
} from '../../services/domain.services';
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

export const ClientRequestsPage: React.FC = () => {
  const { currentUser, dataVersion } = useApp();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [inspectFile, setInspectFile] = useState<ProjectFile | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const [p, q, o] = await Promise.all([
        ProjectService.listByClient(currentUser.id),
        QuoteService.listByClient(currentUser.id),
        OrderService.listByClient(currentUser.id),
      ]);
      if (active) {
        setProjects(p);
        setQuotes(q);
        setOrders(o);
        if (selectedProject) {
          setSelectedProject(p.find((item) => item.id === selectedProject.id) || null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, dataVersion]);

  const filtered = useMemo(() => {
    if (statusTab === 'ALL') return projects;
    return projects.filter((p) => p.status === statusTab);
  }, [projects, statusTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Minhas Solicitações
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe todas as solicitações abertas, em negociação, aprovadas, em
            produção e concluídas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cliente/nova-solicitacao')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" /> Nova Solicitação
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        {[
          { id: 'ALL', label: 'Todas' },
          { id: ProjectStatus.OPEN, label: 'Abertas' },
          { id: ProjectStatus.IN_NEGOTIATION, label: 'Em negociação' },
          { id: ProjectStatus.APPROVED, label: 'Aprovadas' },
          { id: ProjectStatus.IN_PRODUCTION, label: 'Em produção' },
          { id: ProjectStatus.COMPLETED, label: 'Concluídas' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStatusTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              statusTab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação neste estágio"
          description="Você pode cadastrar um novo projeto 3D ou alternar as abas de status acima."
          actionLabel="Cadastrar Novo Projeto"
          onAction={() => navigate('/cliente/nova-solicitacao')}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-5">Projeto & Especificação</th>
                  <th className="py-3 px-4 text-right">Qtd.</th>
                  <th className="py-3 px-4">Prazo Desejado</th>
                  <th className="py-3 px-4 text-right">Orçamentos</th>
                  <th className="py-3 px-4">Status Atual</th>
                  <th className="py-3 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((prj) => {
                  const st = PROJECT_STATUS_LABEL[prj.status];
                  const prjQuotes = quotes.filter((q) => q.projectId === prj.id);
                  const linkedOrder = orders.find((o) => o.projectId === prj.id);

                  return (
                    <tr key={prj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">{prj.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {prj.desiredTechnology} · {prj.desiredMaterial} ·{' '}
                          {prj.dimensionsApproxMm} · {prj.files.length} arquivo(s)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800">
                        {prj.quantity}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-600">
                        {formatDateBR(prj.desiredDeadline)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-semibold text-slate-800">
                        {prjQuotes.length}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className={`font-medium ${st.colorClass}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(prj)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                          >
                            Detalhes
                          </button>
                          {linkedOrder ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/cliente/pedido/${linkedOrder.id}`)
                              }
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                            >
                              Ver Pedido
                            </button>
                          ) : prjQuotes.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => navigate('/cliente/orcamentos')}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                            >
                              Ver Propostas
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <div className="text-xs text-slate-500">
                  Cadastrado em {formatDateTimeBR(selectedProject.createdAt)} ·{' '}
                  <span
                    className={`font-medium ${
                      PROJECT_STATUS_LABEL[selectedProject.status].colorClass
                    }`}
                  >
                    {PROJECT_STATUS_LABEL[selectedProject.status].text}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                  {selectedProject.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <p className="text-slate-700 leading-relaxed">
                {selectedProject.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3.5 border-y border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Tecnologia</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {selectedProject.desiredTechnology}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Material & Cor</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {selectedProject.desiredMaterial} · {selectedProject.desiredColor}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Quantidade / Dimensões</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5 block">
                    {selectedProject.quantity} un. · {selectedProject.dimensionsApproxMm}
                  </span>
                </div>
              </div>

              {selectedProject.technicalNotes && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Observações Técnicas
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selectedProject.technicalNotes}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-900 mb-2">
                  Arquivos Anexados ({selectedProject.files.length})
                </h4>
                {selectedProject.files.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum arquivo anexado.</p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {selectedProject.files.map((f) => {
                      const is3D = ['STL', 'OBJ', '3MF'].includes(
                        f.extension.toUpperCase()
                      );
                      return (
                        <div
                          key={f.id}
                          className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {f.fileName}
                            </div>
                            <div className="font-mono tabular-nums text-slate-500">
                              {f.extension} · {formatBytes(f.sizeBytes)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setInspectFile(f)}
                              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {is3D ? '3D' : 'Abrir'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void ProjectService.triggerFileDownload(f)}
                              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
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
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Fechar
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
