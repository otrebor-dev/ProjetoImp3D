import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { useApp } from '../core/AppContext';
import { UserRole } from '../models';
import { DEMO_USERS } from '../services/seed.service';

export const AuthLayout: React.FC = () => {
  const { switchDemoAccount } = useApp();
  const navigate = useNavigate();

  const handleQuickDemo = async (userId: string) => {
    const user = await switchDemoAccount(userId);
    navigate(
      user.role === UserRole.CLIENT ? '/cliente/dashboard' : '/parceiro/dashboard',
      { replace: true }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Brand & Value Proposition Column */}
      <div className="lg:w-[46%] bg-slate-950 text-white p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              ICM · Impressão Compartilhada
            </span>
          </div>

          <h1 className="mt-10 lg:mt-16 font-display text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight max-w-lg">
            Conectando horas ociosas de manufatura aditiva a projetos de engenharia.
          </h1>
          <p className="mt-4 text-sm lg:text-base text-slate-300 leading-relaxed max-w-md">
            Contrate capacidade produtiva verificada em FDM, SLA, SLS e DMLS metálico, ou
            rentabilize a disponibilidade das suas impressoras 3D com negociação técnica
            e custódia simulada em escrow.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/90 max-w-md">
            <div>
              <div className="font-mono tabular-nums text-2xl font-semibold text-white">
                4
              </div>
              <div className="text-xs text-slate-400 mt-1">Tecnologias industriais</div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-2xl font-semibold text-white">
                249h
              </div>
              <div className="text-xs text-slate-400 mt-1">Capacidade ativa na rede</div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-2xl font-semibold text-white">
                3D CAD
              </div>
              <div className="text-xs text-slate-400 mt-1">Inspeção STL/OBJ/3MF</div>
            </div>
          </div>
        </div>

        {/* Instant Demo Access Block */}
        <div className="mt-10 pt-6 border-t border-slate-800">
          <div className="text-xs font-medium text-slate-400 mb-3">
            Acesso rápido aos ambientes demonstrativos (sem digitar credenciais):
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void handleQuickDemo(DEMO_USERS.CLIENT_PRIMARY.id)}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2.5 text-left transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  Entrar como Cliente Demo
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Marina Costa · AeroVant
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => void handleQuickDemo(DEMO_USERS.PARTNER_PRIMARY.id)}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2.5 text-left transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  Entrar como Parceiro Demo
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Vértice Manufatura 3D
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
            </button>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            Persistência 100% local via IndexedDB e LocalStorage neste navegador. Sem
            envio externo de credenciais ou cobrança bancária real.
          </p>
        </div>
      </div>

      {/* Right Form Outlet */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
