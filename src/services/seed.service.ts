import {
  Equipment,
  EquipmentStatus,
  Material,
  Message,
  Notification,
  NotificationType,
  Order,
  OrderStatus,
  PaymentEscrowStatus,
  PrintTechnology,
  Project,
  ProjectStatus,
  Quote,
  QuoteStatus,
  User,
  UserRole,
} from '../models';
import { generateSampleStlBlob } from './stl-generator.util';
import { StorageService } from './storage.service';

import printerFdmImg from '../assets/images/printer_fdm_industrial_1793577561744.jpg';
import printerSlaImg from '../assets/images/printer_sla_resin_1793577564915.jpg';
import printerSlsImg from '../assets/images/printer_sls_nylon_1793577565929.jpg';
import printerDmlsImg from '../assets/images/printer_metal_dmls_1793577566657.jpg';

export const MATERIAL_CATALOG: Material[] = [
  {
    id: 'mat-pla-pro',
    name: 'PLA Pro Engenharia',
    category: 'Polímero',
    compatibleTechnologies: [PrintTechnology.FDM],
    colorOptions: ['Preto Fosco', 'Cinza Técnico', 'Branco Polar', 'Azul Cobalto'],
    densityGcm3: 1.24,
  },
  {
    id: 'mat-petg-cf',
    name: 'PETG Fibra de Carbono',
    category: 'Compósito',
    compatibleTechnologies: [PrintTechnology.FDM],
    colorOptions: ['Preto Carbono', 'Grafite'],
    densityGcm3: 1.29,
  },
  {
    id: 'mat-abs-ind',
    name: 'ABS Industrial Térmico',
    category: 'Polímero',
    compatibleTechnologies: [PrintTechnology.FDM],
    colorOptions: ['Preto', 'Cinza Claro', 'Natural'],
    densityGcm3: 1.04,
  },
  {
    id: 'mat-pa12-cf',
    name: 'Nylon PA12-CF15',
    category: 'Compósito',
    compatibleTechnologies: [PrintTechnology.FDM, PrintTechnology.SLS],
    colorOptions: ['Preto Antracite'],
    densityGcm3: 1.08,
  },
  {
    id: 'mat-pa12-sls',
    name: 'Nylon PA12 Sinterizado',
    category: 'Polímero',
    compatibleTechnologies: [PrintTechnology.SLS, PrintTechnology.MJF],
    colorOptions: ['Cinza Grafite', 'Branco Tingível'],
    densityGcm3: 1.01,
  },
  {
    id: 'mat-resin-tough',
    name: 'Resina Tough 2000 UV',
    category: 'Resina',
    compatibleTechnologies: [PrintTechnology.SLA],
    colorOptions: ['Cinza Escuro', 'Translúcido Âmbar'],
    densityGcm3: 1.15,
  },
  {
    id: 'mat-resin-high-temp',
    name: 'Resina High-Temp 230°C',
    category: 'Resina',
    compatibleTechnologies: [PrintTechnology.SLA],
    colorOptions: ['Âmbar Técnico'],
    densityGcm3: 1.18,
  },
  {
    id: 'mat-inox-316l',
    name: 'Aço Inox 316L',
    category: 'Metal',
    compatibleTechnologies: [PrintTechnology.DMLS],
    colorOptions: ['Metálico Jateado'],
    densityGcm3: 7.99,
  },
  {
    id: 'mat-ti64',
    name: 'Titânio Ti6Al4V Grau 5',
    category: 'Metal',
    compatibleTechnologies: [PrintTechnology.DMLS],
    colorOptions: ['Titânio Natural'],
    densityGcm3: 4.43,
  },
];

export const DEMO_USERS = {
  CLIENT_PRIMARY: {
    id: 'usr-client-marina',
    email: 'cliente@demo.icm.br',
    password: 'Demo123',
    label: 'Marina Costa (Cliente — AeroVant Engenharia)',
  },
  CLIENT_SECONDARY: {
    id: 'usr-client-carlos',
    email: 'carlos.mendes@demo.icm.br',
    password: 'Demo123',
    label: 'Carlos Mendes (Cliente — BioMed Protótipos)',
  },
  PARTNER_PRIMARY: {
    id: 'usr-partner-vertice',
    email: 'parceiro@demo.icm.br',
    password: 'Demo123',
    label: 'Vértice Manufatura Aditiva (Parceiro — São Paulo, SP)',
  },
  PARTNER_SECONDARY: {
    id: 'usr-partner-sultech',
    email: 'contato@sultech3d.demo.br',
    password: 'Demo123',
    label: 'SulTech Impressão Industrial (Parceiro — Joinville, SC)',
  },
};

export const DEFAULT_EQUIPMENT_PHOTOS: Record<PrintTechnology, string> = {
  [PrintTechnology.FDM]: printerFdmImg,
  [PrintTechnology.SLA]: printerSlaImg,
  [PrintTechnology.SLS]: printerSlsImg,
  [PrintTechnology.DMLS]: printerDmlsImg,
  [PrintTechnology.MJF]: printerSlsImg,
};

export async function ensureDemoSeed(forceReset = false): Promise<void> {
  await StorageService.init();

  if (forceReset) {
    await StorageService.clearAllData();
  }

  const existingUsers = await StorageService.getAll<User>('users');
  if (!forceReset && StorageService.isSeeded() && existingUsers.length > 0) {
    return;
  }

  const now = Date.now();
  const isoMinusHours = (h: number) => new Date(now - h * 3600_000).toISOString();
  const datePlusDays = (d: number) =>
    new Date(now + d * 86_400_000).toISOString().slice(0, 10);

  const users: User[] = [
    {
      id: DEMO_USERS.CLIENT_PRIMARY.id,
      role: UserRole.CLIENT,
      email: DEMO_USERS.CLIENT_PRIMARY.email,
      passwordHash: DEMO_USERS.CLIENT_PRIMARY.password,
      phone: '(11) 98742-3109',
      acceptedTerms: true,
      emailVerified: true,
      isDemo: true,
      createdAt: isoMinusHours(320),
      updatedAt: isoMinusHours(24),
      clientProfile: {
        fullName: 'Marina Costa',
        organization: 'AeroVant Sistemas Autônomos',
        department: 'Engenharia Mecânica & P&D',
        defaultShippingCity: 'São José dos Campos, SP',
      },
    },
    {
      id: DEMO_USERS.CLIENT_SECONDARY.id,
      role: UserRole.CLIENT,
      email: DEMO_USERS.CLIENT_SECONDARY.email,
      passwordHash: DEMO_USERS.CLIENT_SECONDARY.password,
      phone: '(41) 99128-4402',
      acceptedTerms: true,
      emailVerified: true,
      isDemo: true,
      createdAt: isoMinusHours(280),
      updatedAt: isoMinusHours(48),
      clientProfile: {
        fullName: 'Carlos Eduardo Mendes',
        organization: 'BioMed Dispositivos Cirúrgicos',
        department: 'Prototipagem Clínica',
        defaultShippingCity: 'Curitiba, PR',
      },
    },
    {
      id: DEMO_USERS.PARTNER_PRIMARY.id,
      role: UserRole.PARTNER,
      email: DEMO_USERS.PARTNER_PRIMARY.email,
      passwordHash: DEMO_USERS.PARTNER_PRIMARY.password,
      phone: '(11) 3489-7720',
      acceptedTerms: true,
      emailVerified: true,
      isDemo: true,
      createdAt: isoMinusHours(400),
      updatedAt: isoMinusHours(12),
      partnerProfile: {
        legalName: 'Vértice Manufatura Aditiva e Prototipagem Ltda',
        companyName: 'Vértice Manufatura Aditiva',
        cpfCnpj: '11.222.333/0001-81',
        city: 'São Paulo',
        state: 'SP',
        bio: 'Centro técnico especializado em polímeros de engenharia reforçados com fibra de carbono, resinas técnicas SLA e sinterização seletiva a laser.',
        rating: 4.9,
        completedJobsCount: 48,
      },
    },
    {
      id: DEMO_USERS.PARTNER_SECONDARY.id,
      role: UserRole.PARTNER,
      email: DEMO_USERS.PARTNER_SECONDARY.email,
      passwordHash: DEMO_USERS.PARTNER_SECONDARY.password,
      phone: '(47) 3028-9100',
      acceptedTerms: true,
      emailVerified: true,
      isDemo: true,
      createdAt: isoMinusHours(450),
      updatedAt: isoMinusHours(18),
      partnerProfile: {
        legalName: 'SulTech Metalurgia e Impressão Industrial S.A.',
        companyName: 'SulTech Impressão Industrial',
        cpfCnpj: '04.252.011/0001-10',
        city: 'Joinville',
        state: 'SC',
        bio: 'Parque fabril certificado ISO 9001 com capacidade ociosa programada em DMLS metálico e SLS PA12 para lotes seriados.',
        rating: 4.8,
        completedJobsCount: 73,
      },
    },
  ];

  const equipments: Equipment[] = [
    {
      id: 'eq-fdm-nexus3000',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      name: 'Célula CoreXY Industrial Câmara Aquecida',
      manufacturer: 'Bambu / Nexus Industrial',
      model: 'X1E Carbon Pro HT',
      technology: PrintTechnology.FDM,
      materials: ['Nylon PA12-CF15', 'PETG Fibra de Carbono', 'ABS Industrial Térmico', 'PLA Pro Engenharia'],
      buildVolumeMm: { x: 256, y: 256, z: 256 },
      precisionMicrons: 100,
      availableHours: 64,
      hourlyRateBrl: 48,
      location: 'São Paulo, SP',
      photos: [printerFdmImg],
      status: EquipmentStatus.AVAILABLE,
      description:
        'Impressora CoreXY fechada com controle ativo de temperatura de câmara até 60°C e bico em aço temperado para compósitos estruturais.',
      technicalNotes:
        'Tolerância dimensional típica ±0,15 mm. Estufa de secagem dedicada para filamentos higroscópicos PA12-CF.',
      isDemo: true,
      createdAt: isoMinusHours(300),
      updatedAt: isoMinusHours(10),
    },
    {
      id: 'eq-sla-protoforge500',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      name: 'Estação SLA Laser de Alta Resolução',
      manufacturer: 'Formlabs / ProtoForge',
      model: 'Form 4L Precision SLA-500',
      technology: PrintTechnology.SLA,
      materials: ['Resina Tough 2000 UV', 'Resina High-Temp 230°C'],
      buildVolumeMm: { x: 335, y: 200, z: 300 },
      precisionMicrons: 25,
      availableHours: 38,
      hourlyRateBrl: 82,
      location: 'São Paulo, SP',
      photos: [printerSlaImg],
      status: EquipmentStatus.AVAILABLE,
      description:
        'Sistema estereolitográfico de grande formato com pós-cura UV automatizada para validação funcional, alojamentos ópticos e gabaritos finos.',
      technicalNotes:
        'Camadas entre 25 µm e 100 µm. Lavagem automatizada em IPA anidro inclusa na hora-máquina.',
      isDemo: true,
      createdAt: isoMinusHours(290),
      updatedAt: isoMinusHours(15),
    },
    {
      id: 'eq-sls-sinter5600',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      name: 'Sinterizadora Seletiva a Laser Polímeros',
      manufacturer: 'EOS / Fuse Series',
      model: 'Polymer SLS S600',
      technology: PrintTechnology.SLS,
      materials: ['Nylon PA12 Sinterizado', 'Nylon PA12-CF15'],
      buildVolumeMm: { x: 300, y: 300, z: 450 },
      precisionMicrons: 80,
      availableHours: 22,
      hourlyRateBrl: 145,
      location: 'São Paulo, SP',
      photos: [printerSlsImg],
      status: EquipmentStatus.PARTIALLY_AVAILABLE,
      description:
        'Leito de pó em Nylon PA12 sem necessidade de estruturas de suporte, ideal para geometrias orgânicas, dutos internos e pequenos lotes.',
      technicalNotes:
        'Janelas de batelada abertas às terças e quintas. Acabamento por jateamento de microesferas de vidro incluso.',
      isDemo: true,
      createdAt: isoMinusHours(260),
      updatedAt: isoMinusHours(6),
    },
    {
      id: 'eq-dmls-eosm290',
      partnerId: DEMO_USERS.PARTNER_SECONDARY.id,
      partnerName: 'SulTech Impressão Industrial',
      name: 'Sistema DMLS Metal Direto Atmosfera Inerte',
      manufacturer: 'EOS GmbH',
      model: 'EOS M 290 Metal',
      technology: PrintTechnology.DMLS,
      materials: ['Aço Inox 316L', 'Titânio Ti6Al4V Grau 5'],
      buildVolumeMm: { x: 250, y: 250, z: 325 },
      precisionMicrons: 40,
      availableHours: 45,
      hourlyRateBrl: 390,
      location: 'Joinville, SC',
      photos: [printerDmlsImg],
      status: EquipmentStatus.AVAILABLE,
      description:
        'Fusão seletiva a laser em leito metálico sob atmosfera de argônio de alta pureza para rotores, implantes de bancada e ferramentas conformais.',
      technicalNotes:
        'Acompanha alívio térmico de tensões e relatório dimensional em CMM Hexagon sob solicitação.',
      isDemo: true,
      createdAt: isoMinusHours(340),
      updatedAt: isoMinusHours(14),
    },
    {
      id: 'eq-sls-sultech-p396',
      partnerId: DEMO_USERS.PARTNER_SECONDARY.id,
      partnerName: 'SulTech Impressão Industrial',
      name: 'Célula Industrial SLS Lotes Seriados',
      manufacturer: 'EOS GmbH',
      model: 'P 396 Production',
      technology: PrintTechnology.SLS,
      materials: ['Nylon PA12 Sinterizado'],
      buildVolumeMm: { x: 340, y: 340, z: 600 },
      precisionMicrons: 90,
      availableHours: 80,
      hourlyRateBrl: 132,
      location: 'Joinville, SC',
      photos: [printerSlsImg],
      status: EquipmentStatus.AVAILABLE,
      description:
        'Alta disponibilidade de horas noturnas e finais de semana para consolidação de peças técnicas em PA12 com excelente isotropia mecânica.',
      technicalNotes: 'Envio expresso para Sul e Sudeste em até 48h após inspeção.',
      isDemo: true,
      createdAt: isoMinusHours(310),
      updatedAt: isoMinusHours(20),
    },
  ];

  // Gerar arquivos STL binários reais e salvar no IndexedDB para inspeção 3D imediata
  const bracketStl = generateSampleStlBlob('bracket');
  const gearStl = generateSampleStlBlob('gear');
  const rotorStl = generateSampleStlBlob('impeller_housing');

  await StorageService.saveFileBlob(
    'blob-demo-bracket-stl',
    bracketStl.blob,
    bracketStl.fileName,
    'model/stl'
  );
  await StorageService.saveFileBlob(
    'blob-demo-gear-stl',
    gearStl.blob,
    gearStl.fileName,
    'model/stl'
  );
  await StorageService.saveFileBlob(
    'blob-demo-rotor-stl',
    rotorStl.blob,
    rotorStl.fileName,
    'model/stl'
  );

  const specTextBlob = new Blob(
    [
      'ESPECIFICACAO TECNICA AEROVANT - REV C\n' +
        '1. Material: Nylon PA12-CF15 (15% fibra de carbono)\n' +
        '2. Preenchimento minimo: 45% Gyroid, 4 perimetros externos\n' +
        '3. Tolerancia geral ISO 2768-m\n' +
        '4. Inspecionar diametro interno do mancal (32,00 +0,10/-0,00 mm)\n',
    ],
    { type: 'text/plain' }
  );
  await StorageService.saveFileBlob(
    'blob-demo-spec-txt',
    specTextBlob,
    'memorial_tolerancias_revC.txt',
    'text/plain'
  );

  const projects: Project[] = [
    {
      id: 'prj-aerovant-bracket',
      clientId: DEMO_USERS.CLIENT_PRIMARY.id,
      clientName: 'Marina Costa',
      targetEquipmentId: 'eq-fdm-nexus3000',
      targetPartnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      title: 'Suporte Estrutural de Mancal VANT — Lote Piloto',
      description:
        'Suporte estrutural em L com nervuras laterais para fixação do atuador de profundor. Exige alta rigidez específica e estabilidade térmica até 95°C.',
      quantity: 12,
      desiredMaterial: 'Nylon PA12-CF15',
      desiredColor: 'Preto Antracite',
      dimensionsApproxMm: '84 x 56 x 56 mm',
      desiredTechnology: PrintTechnology.FDM,
      desiredDeadline: datePlusDays(7),
      technicalNotes: ' Imprimir com 4 paredes sólidas e camada de 0,20 mm. Rosca pós-usinada pelo cliente.',
      files: [
        {
          id: 'file-bracket-1',
          projectId: 'prj-aerovant-bracket',
          fileName: bracketStl.fileName,
          extension: 'STL',
          mimeType: 'model/stl',
          sizeBytes: bracketStl.blob.size,
          blobKey: 'blob-demo-bracket-stl',
          uploadedByUserId: DEMO_USERS.CLIENT_PRIMARY.id,
          uploadedAt: isoMinusHours(96),
          category: 'ORIGINAL_CAD',
        },
        {
          id: 'file-bracket-spec',
          projectId: 'prj-aerovant-bracket',
          fileName: 'memorial_tolerancias_revC.txt',
          extension: 'TXT',
          mimeType: 'text/plain',
          sizeBytes: specTextBlob.size,
          blobKey: 'blob-demo-spec-txt',
          uploadedByUserId: DEMO_USERS.CLIENT_PRIMARY.id,
          uploadedAt: isoMinusHours(96),
          category: 'SPECIFICATION',
        },
      ],
      status: ProjectStatus.IN_PRODUCTION,
      isDemo: true,
      createdAt: isoMinusHours(96),
      updatedAt: isoMinusHours(18),
    },
    {
      id: 'prj-aerovant-gears',
      clientId: DEMO_USERS.CLIENT_PRIMARY.id,
      clientName: 'Marina Costa',
      title: 'Conjunto Engrenagens Planetárias Redutor 20Z',
      description:
        'Conjunto de engrenagens para bancada de ensaio de transmissão leve. Necessitamos de superfície uniforme sem marcas de suporte nos dentes.',
      quantity: 20,
      desiredMaterial: 'Nylon PA12 Sinterizado',
      desiredColor: 'Cinza Grafite',
      dimensionsApproxMm: '68 x 68 x 22 mm',
      desiredTechnology: PrintTechnology.SLS,
      desiredDeadline: datePlusDays(10),
      technicalNotes: 'Concentricidade crítica no cubo central. Enviar proposta contemplando jateamento fino.',
      files: [
        {
          id: 'file-gear-1',
          projectId: 'prj-aerovant-gears',
          fileName: gearStl.fileName,
          extension: 'STL',
          mimeType: 'model/stl',
          sizeBytes: gearStl.blob.size,
          blobKey: 'blob-demo-gear-stl',
          uploadedByUserId: DEMO_USERS.CLIENT_PRIMARY.id,
          uploadedAt: isoMinusHours(36),
          category: 'ORIGINAL_CAD',
        },
      ],
      status: ProjectStatus.IN_NEGOTIATION,
      isDemo: true,
      createdAt: isoMinusHours(36),
      updatedAt: isoMinusHours(14),
    },
    {
      id: 'prj-aerovant-diffuser',
      clientId: DEMO_USERS.CLIENT_PRIMARY.id,
      clientName: 'Marina Costa',
      title: 'Difusor de Fluxo Térmico Sensor Óptico',
      description:
        'Corpo aletado para dissipação e direcionamento de ar em câmara de calibração. Aberto para propostas em SLA High-Temp ou DMLS Inox 316L.',
      quantity: 4,
      desiredMaterial: 'Resina High-Temp 230°C',
      desiredColor: 'Âmbar Técnico',
      dimensionsApproxMm: '80 x 80 x 45 mm',
      desiredTechnology: PrintTechnology.SLA,
      desiredDeadline: datePlusDays(12),
      technicalNotes: 'Aletas externas de 3 mm de espessura; requer ótima definição superficial.',
      files: [
        {
          id: 'file-rotor-1',
          projectId: 'prj-aerovant-diffuser',
          fileName: rotorStl.fileName,
          extension: 'STL',
          mimeType: 'model/stl',
          sizeBytes: rotorStl.blob.size,
          blobKey: 'blob-demo-rotor-stl',
          uploadedByUserId: DEMO_USERS.CLIENT_PRIMARY.id,
          uploadedAt: isoMinusHours(8),
          category: 'ORIGINAL_CAD',
        },
      ],
      status: ProjectStatus.OPEN,
      isDemo: true,
      createdAt: isoMinusHours(8),
      updatedAt: isoMinusHours(8),
    },
    {
      id: 'prj-biomed-guide',
      clientId: DEMO_USERS.CLIENT_SECONDARY.id,
      clientName: 'Carlos Eduardo Mendes',
      targetEquipmentId: 'eq-sla-protoforge500',
      targetPartnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      title: 'Alojamento Ergonômico Transdutor Ultrassom',
      description:
        'Lote de validação ergonômica em resina de alta resistência ao impacto para testes de montagem em laboratório.',
      quantity: 6,
      desiredMaterial: 'Resina Tough 2000 UV',
      desiredColor: 'Cinza Escuro',
      dimensionsApproxMm: '110 x 48 x 42 mm',
      desiredTechnology: PrintTechnology.SLA,
      desiredDeadline: datePlusDays(-2),
      technicalNotes: 'Pós-cura completa exigida.',
      files: [
        {
          id: 'file-biomed-1',
          projectId: 'prj-biomed-guide',
          fileName: bracketStl.fileName,
          extension: 'STL',
          mimeType: 'model/stl',
          sizeBytes: bracketStl.blob.size,
          blobKey: 'blob-demo-bracket-stl',
          uploadedByUserId: DEMO_USERS.CLIENT_SECONDARY.id,
          uploadedAt: isoMinusHours(220),
          category: 'ORIGINAL_CAD',
        },
      ],
      status: ProjectStatus.COMPLETED,
      isDemo: true,
      createdAt: isoMinusHours(220),
      updatedAt: isoMinusHours(40),
    },
  ];

  const quotes: Quote[] = [
    {
      id: 'qt-aerovant-bracket-vertice',
      projectId: 'prj-aerovant-bracket',
      projectTitle: 'Suporte Estrutural de Mancal VANT — Lote Piloto',
      clientId: DEMO_USERS.CLIENT_PRIMARY.id,
      clientName: 'Marina Costa',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      equipmentId: 'eq-fdm-nexus3000',
      equipmentName: 'Célula CoreXY Industrial Câmara Aquecida (X1E Carbon Pro HT)',
      materialUsed: 'Nylon PA12-CF15',
      quantity: 12,
      estimatedPrintHours: 14,
      prepHours: 1.5,
      hourlyRateBrl: 48,
      materialCostBrl: 310,
      operationCostBrl: 65,
      additionalCostsBrl: 45,
      totalValueBrl: 1164, // (14 + 1.5)*48 = 744 + 310 + 65 + 45 = 1164
      productionLeadDays: 4,
      deliveryLeadDays: 2,
      technicalNotes:
        'Filamento seco por 12h a 80°C antes da impressão. Inclusa inspeção dimensional com paquímetro calibrado Mitutoyo em todas as 12 peças.',
      items: [
        {
          id: 'qi-1',
          description: 'Horas-máquina e preparação (15,5 h × R$ 48,00)',
          quantity: 15.5,
          unitCostBrl: 48,
          subtotalBrl: 744,
        },
        {
          id: 'qi-2',
          description: 'Insumo Nylon PA12-CF15 certificado',
          quantity: 1,
          unitCostBrl: 310,
          subtotalBrl: 310,
        },
        {
          id: 'qi-3',
          description: 'Operação, pós-processamento e embalagem técnica',
          quantity: 1,
          unitCostBrl: 110,
          subtotalBrl: 110,
        },
      ],
      status: QuoteStatus.APPROVED,
      isDemo: true,
      createdAt: isoMinusHours(84),
      updatedAt: isoMinusHours(72),
    },
    {
      id: 'qt-aerovant-gears-vertice',
      projectId: 'prj-aerovant-gears',
      projectTitle: 'Conjunto Engrenagens Planetárias Redutor 20Z',
      clientId: DEMO_USERS.CLIENT_PRIMARY.id,
      clientName: 'Marina Costa',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      equipmentId: 'eq-sls-sinter5600',
      equipmentName: 'Sinterizadora Seletiva a Laser Polímeros (Polymer SLS S600)',
      materialUsed: 'Nylon PA12 Sinterizado',
      quantity: 20,
      estimatedPrintHours: 6.5,
      prepHours: 1,
      hourlyRateBrl: 145,
      materialCostBrl: 420,
      operationCostBrl: 90,
      additionalCostsBrl: 60,
      totalValueBrl: 1657.5, // 7.5 * 145 = 1087.5 + 420 + 90 + 60 = 1657.5
      productionLeadDays: 5,
      deliveryLeadDays: 2,
      technicalNotes:
        'Nesting otimizado no centro térmico da câmara SLS S600 para máxima circularidade dos 20 dentes. Jateamento por microesferas incluso.',
      items: [
        {
          id: 'qi-g1',
          description: 'Horas-máquina SLS (7,5 h × R$ 145,00)',
          quantity: 7.5,
          unitCostBrl: 145,
          subtotalBrl: 1087.5,
        },
        {
          id: 'qi-g2',
          description: 'Pó poliamida PA12 renovado (taxa refresh 30%)',
          quantity: 1,
          unitCostBrl: 420,
          subtotalBrl: 420,
        },
        {
          id: 'qi-g3',
          description: 'Desempacotamento e jateamento fino',
          quantity: 1,
          unitCostBrl: 150,
          subtotalBrl: 150,
        },
      ],
      status: QuoteStatus.SENT,
      isDemo: true,
      createdAt: isoMinusHours(14),
      updatedAt: isoMinusHours(14),
    },
    {
      id: 'qt-aerovant-gears-sultech',
      projectId: 'prj-aerovant-gears',
      projectTitle: 'Conjunto Engrenagens Planetárias Redutor 20Z',
      clientId: DEMO_USERS.CLIENT_PRIMARY.id,
      clientName: 'Marina Costa',
      partnerId: DEMO_USERS.PARTNER_SECONDARY.id,
      partnerName: 'SulTech Impressão Industrial',
      equipmentId: 'eq-sls-sultech-p396',
      equipmentName: 'Célula Industrial SLS Lotes Seriados (P 396 Production)',
      materialUsed: 'Nylon PA12 Sinterizado',
      quantity: 20,
      estimatedPrintHours: 6,
      prepHours: 1,
      hourlyRateBrl: 132,
      materialCostBrl: 390,
      operationCostBrl: 85,
      additionalCostsBrl: 80,
      totalValueBrl: 1479, // 7 * 132 = 924 + 390 + 85 + 80 = 1479
      productionLeadDays: 4,
      deliveryLeadDays: 3,
      technicalNotes:
        'Batelada noturna disponível já amanhã na EOS P 396. Relatório dimensional por amostragem de 5 unidades incluso.',
      items: [
        {
          id: 'qi-s1',
          description: 'Horas-máquina EOS P 396 (7,0 h × R$ 132,00)',
          quantity: 7,
          unitCostBrl: 132,
          subtotalBrl: 924,
        },
        {
          id: 'qi-s2',
          description: 'Material PA12 Industrial + Operação e Frete Expresso',
          quantity: 1,
          unitCostBrl: 555,
          subtotalBrl: 555,
        },
      ],
      status: QuoteStatus.SENT,
      isDemo: true,
      createdAt: isoMinusHours(11),
      updatedAt: isoMinusHours(11),
    },
    {
      id: 'qt-biomed-approved',
      projectId: 'prj-biomed-guide',
      projectTitle: 'Alojamento Ergonômico Transdutor Ultrassom',
      clientId: DEMO_USERS.CLIENT_SECONDARY.id,
      clientName: 'Carlos Eduardo Mendes',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      equipmentId: 'eq-sla-protoforge500',
      equipmentName: 'Estação SLA Laser de Alta Resolução (Form 4L Precision SLA-500)',
      materialUsed: 'Resina Tough 2000 UV',
      quantity: 6,
      estimatedPrintHours: 8,
      prepHours: 1,
      hourlyRateBrl: 82,
      materialCostBrl: 290,
      operationCostBrl: 70,
      additionalCostsBrl: 42,
      totalValueBrl: 1140,
      productionLeadDays: 3,
      deliveryLeadDays: 2,
      technicalNotes: 'Camada de 50 mícrons com lavagem dupla em IPA e cura térmica a 70°C por 60 min.',
      items: [
        {
          id: 'qi-b1',
          description: 'Horas SLA-500 + Resina Tough 2000 UV + Pós-cura',
          quantity: 6,
          unitCostBrl: 190,
          subtotalBrl: 1140,
        },
      ],
      status: QuoteStatus.APPROVED,
      isDemo: true,
      createdAt: isoMinusHours(200),
      updatedAt: isoMinusHours(190),
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-icm-2026-0104',
      code: 'ICM-2026-0104',
      projectId: 'prj-aerovant-bracket',
      projectTitle: 'Suporte Estrutural de Mancal VANT — Lote Piloto',
      quoteId: 'qt-aerovant-bracket-vertice',
      clientId: DEMO_USERS.CLIENT_PRIMARY.id,
      clientName: 'Marina Costa',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      equipmentId: 'eq-fdm-nexus3000',
      equipmentName: 'Célula CoreXY Industrial Câmara Aquecida (X1E Carbon Pro HT)',
      technology: PrintTechnology.FDM,
      material: 'Nylon PA12-CF15',
      quantity: 12,
      totalValueBrl: 1164,
      estimatedDeliveryDate: datePlusDays(5),
      currentStatus: OrderStatus.IN_PRODUCTION,
      productionNotes:
        'Batelada 1/2 (6 unidades) concluída dentro da tolerância (+0,04 mm no furo de mancal). Batelada 2/2 em impressão na câmara aquecida a 58°C.',
      timeline: [
        {
          id: 'tl-104-1',
          status: OrderStatus.WAITING_APPROVAL,
          label: 'Aguardando aprovação',
          description: 'Proposta comercial enviada pela Vértice Manufatura Aditiva e aprovada pela cliente.',
          updatedByUserId: DEMO_USERS.CLIENT_PRIMARY.id,
          updatedByName: 'Marina Costa',
          updatedByRole: UserRole.CLIENT,
          timestamp: isoMinusHours(72),
        },
        {
          id: 'tl-104-2',
          status: OrderStatus.ESCROW_PAYMENT,
          label: 'Pagamento em escrow',
          description:
            'Valor integral de R$ 1.164,00 reservado em conta garantia simulada (PIX Corporativo Simulado). Repasse retido até conclusão.',
          updatedByUserId: DEMO_USERS.CLIENT_PRIMARY.id,
          updatedByName: 'Marina Costa',
          updatedByRole: UserRole.CLIENT,
          timestamp: isoMinusHours(71.8),
        },
        {
          id: 'tl-104-3',
          status: OrderStatus.IN_PRODUCTION,
          label: 'Em produção',
          description:
            'Filamento PA12-CF15 desumidificado e fatiamento validado. Impressão das 12 peças iniciada na célula X1E Carbon Pro HT.',
          updatedByUserId: DEMO_USERS.PARTNER_PRIMARY.id,
          updatedByName: 'Vértice Manufatura Aditiva',
          updatedByRole: UserRole.PARTNER,
          timestamp: isoMinusHours(18),
        },
      ],
      paymentSimulation: {
        id: 'pay-sim-104',
        orderId: 'ord-icm-2026-0104',
        amountBrl: 1164,
        platformFeeBrl: 93.12,
        partnerNetBrl: 1070.88,
        status: PaymentEscrowStatus.RESERVED_IN_ESCROW,
        simulatedMethod: 'PIX Corporativo (Simulado)',
        transactionCode: 'SIM-ESCROW-98412A',
        reservedAt: isoMinusHours(71.8),
        disclaimer:
          'Operação demonstrativa: valores simulados localmente sem movimentação financeira bancária real.',
      },
      complementaryFiles: [],
      isDemo: true,
      createdAt: isoMinusHours(72),
      updatedAt: isoMinusHours(18),
    },
    {
      id: 'ord-icm-2026-0089',
      code: 'ICM-2026-0089',
      projectId: 'prj-biomed-guide',
      projectTitle: 'Alojamento Ergonômico Transdutor Ultrassom',
      quoteId: 'qt-biomed-approved',
      clientId: DEMO_USERS.CLIENT_SECONDARY.id,
      clientName: 'Carlos Eduardo Mendes',
      partnerId: DEMO_USERS.PARTNER_PRIMARY.id,
      partnerName: 'Vértice Manufatura Aditiva',
      equipmentId: 'eq-sla-protoforge500',
      equipmentName: 'Estação SLA Laser de Alta Resolução (Form 4L Precision SLA-500)',
      technology: PrintTechnology.SLA,
      material: 'Resina Tough 2000 UV',
      quantity: 6,
      totalValueBrl: 1140,
      estimatedDeliveryDate: datePlusDays(-2),
      currentStatus: OrderStatus.COMPLETED_SHIPPED,
      trackingCode: 'BR-EXP-44902189-SP',
      productionNotes: 'Lote 100% aprovado em inspeção óptica e dimensional. Despachado em embalagem antiestática.',
      timeline: [
        {
          id: 'tl-89-1',
          status: OrderStatus.WAITING_APPROVAL,
          label: 'Aguardando aprovação',
          description: 'Proposta aprovada pelo cliente Carlos Eduardo Mendes.',
          updatedByUserId: DEMO_USERS.CLIENT_SECONDARY.id,
          updatedByName: 'Carlos Eduardo Mendes',
          updatedByRole: UserRole.CLIENT,
          timestamp: isoMinusHours(190),
        },
        {
          id: 'tl-89-2',
          status: OrderStatus.ESCROW_PAYMENT,
          label: 'Pagamento em escrow',
          description: 'Reserva simulada em garantia confirmada no valor de R$ 1.140,00.',
          updatedByUserId: DEMO_USERS.CLIENT_SECONDARY.id,
          updatedByName: 'Carlos Eduardo Mendes',
          updatedByRole: UserRole.CLIENT,
          timestamp: isoMinusHours(189.5),
        },
        {
          id: 'tl-89-3',
          status: OrderStatus.IN_PRODUCTION,
          label: 'Em produção',
          description: 'Impressão iniciada em camada de 50 µm na Form 4L.',
          updatedByUserId: DEMO_USERS.PARTNER_PRIMARY.id,
          updatedByName: 'Vértice Manufatura Aditiva',
          updatedByRole: UserRole.PARTNER,
          timestamp: isoMinusHours(168),
        },
        {
          id: 'tl-89-4',
          status: OrderStatus.QUALITY_CONTROL,
          label: 'Controle de qualidade',
          description: 'Lavagem IPA, cura UV térmica e validação de encaixes concluídas sem desvios.',
          updatedByUserId: DEMO_USERS.PARTNER_PRIMARY.id,
          updatedByName: 'Vértice Manufatura Aditiva',
          updatedByRole: UserRole.PARTNER,
          timestamp: isoMinusHours(96),
        },
        {
          id: 'tl-89-5',
          status: OrderStatus.PACKAGING,
          label: 'Embalagem',
          description: 'Peças acondicionadas individualmente em espuma alveolar de proteção.',
          updatedByUserId: DEMO_USERS.PARTNER_PRIMARY.id,
          updatedByName: 'Vértice Manufatura Aditiva',
          updatedByRole: UserRole.PARTNER,
          timestamp: isoMinusHours(60),
        },
        {
          id: 'tl-89-6',
          status: OrderStatus.COMPLETED_SHIPPED,
          label: 'Concluído/Enviado',
          description:
            'Pedido expedido via transportadora (Rastreio BR-EXP-44902189-SP). Liquidação do escrow simulado registrada.',
          updatedByUserId: DEMO_USERS.PARTNER_PRIMARY.id,
          updatedByName: 'Vértice Manufatura Aditiva',
          updatedByRole: UserRole.PARTNER,
          timestamp: isoMinusHours(40),
        },
      ],
      paymentSimulation: {
        id: 'pay-sim-089',
        orderId: 'ord-icm-2026-0089',
        amountBrl: 1140,
        platformFeeBrl: 91.2,
        partnerNetBrl: 1048.8,
        status: PaymentEscrowStatus.RELEASED_TO_PARTNER,
        simulatedMethod: 'Boleto Escrow (Simulado)',
        transactionCode: 'SIM-ESCROW-77201B',
        reservedAt: isoMinusHours(189.5),
        releasedAt: isoMinusHours(40),
        disclaimer:
          'Operação demonstrativa: valores simulados localmente sem movimentação financeira bancária real.',
      },
      complementaryFiles: [],
      isDemo: true,
      createdAt: isoMinusHours(190),
      updatedAt: isoMinusHours(40),
    },
  ];

  const messages: Message[] = [
    {
      id: 'msg-104-1',
      orderId: 'ord-icm-2026-0104',
      projectId: 'prj-aerovant-bracket',
      senderId: DEMO_USERS.CLIENT_PRIMARY.id,
      senderName: 'Marina Costa',
      senderRole: UserRole.CLIENT,
      content:
        'Olá equipe Vértice! Aprovamos o orçamento e confirmamos o depósito em garantia. Por favor, priorizem a orientação das camadas paralela às nervuras laterais para resistir à flexão.',
      createdAt: isoMinusHours(71),
    },
    {
      id: 'msg-104-2',
      orderId: 'ord-icm-2026-0104',
      projectId: 'prj-aerovant-bracket',
      senderId: DEMO_USERS.PARTNER_PRIMARY.id,
      senderName: 'Vértice Manufatura Aditiva',
      senderRole: UserRole.PARTNER,
      content:
        'Perfeito, Marina! Posicionamos a peça deitada lateralmente no fatiador para garantir fibras contínuas ao longo do perfil L e das duas nervuras. As primeiras 6 unidades já saíram da máquina com ótimo acabamento.',
      createdAt: isoMinusHours(17.5),
    },
    {
      id: 'msg-104-3',
      orderId: 'ord-icm-2026-0104',
      projectId: 'prj-aerovant-bracket',
      senderId: DEMO_USERS.CLIENT_PRIMARY.id,
      senderName: 'Marina Costa',
      senderRole: UserRole.CLIENT,
      content:
        'Excelente notícia! Assim que avançarem para o Controle de Qualidade, nos avisem por aqui.',
      createdAt: isoMinusHours(15),
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-c-1',
      userId: DEMO_USERS.CLIENT_PRIMARY.id,
      type: NotificationType.QUOTE_SENT,
      title: '2 orçamentos recebidos para análise',
      message:
        'Vértice Manufatura e SulTech enviaram propostas para "Conjunto Engrenagens Planetárias Redutor 20Z".',
      linkPath: '/cliente/orcamentos',
      read: false,
      createdAt: isoMinusHours(11),
    },
    {
      id: 'notif-c-2',
      userId: DEMO_USERS.CLIENT_PRIMARY.id,
      type: NotificationType.PRODUCTION_STARTED,
      title: 'Produção iniciada — Pedido ICM-2026-0104',
      message:
        'Vértice Manufatura Aditiva iniciou a fabricação do lote de Suportes Estruturais VANT.',
      linkPath: '/cliente/pedido/ord-icm-2026-0104',
      read: false,
      createdAt: isoMinusHours(18),
    },
    {
      id: 'notif-p-1',
      userId: DEMO_USERS.PARTNER_PRIMARY.id,
      type: NotificationType.NEW_REQUEST,
      title: 'Nova solicitação compatível com seu parque',
      message:
        'Marina Costa publicou "Difusor de Fluxo Térmico Sensor Óptico" para tecnologia SLA.',
      linkPath: '/parceiro/solicitacoes',
      read: false,
      createdAt: isoMinusHours(8),
    },
    {
      id: 'notif-p-2',
      userId: DEMO_USERS.PARTNER_PRIMARY.id,
      type: NotificationType.NEW_MESSAGE,
      title: 'Nova mensagem no Pedido ICM-2026-0104',
      message: 'Marina Costa respondeu no chat de acompanhamento da produção.',
      linkPath: '/parceiro/pedido/ord-icm-2026-0104',
      read: false,
      createdAt: isoMinusHours(15),
    },
  ];

  await StorageService.putMany('users', users);
  await StorageService.putMany('equipments', equipments);
  await StorageService.putMany('projects', projects);
  await StorageService.putMany('quotes', quotes);
  await StorageService.putMany('orders', orders);
  await StorageService.putMany('messages', messages);
  await StorageService.putMany('notifications', notifications);
  StorageService.markSeeded(true);
}
