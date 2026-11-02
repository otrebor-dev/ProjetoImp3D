import {
  Equipment,
  EquipmentStatus,
  Message,
  Notification,
  NotificationType,
  Order,
  OrderStatus,
  OrderTimeline,
  PaymentEscrowStatus,
  PrintTechnology,
  Project,
  ProjectFile,
  ProjectStatus,
  Quote,
  QuoteItem,
  QuoteStatus,
  User,
  UserRole,
} from '../models';
import { DEFAULT_EQUIPMENT_PHOTOS } from './seed.service';
import { StorageService } from './storage.service';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================
export const NotificationService = {
  async listByUser(userId: string): Promise<Notification[]> {
    const all = await StorageService.getAll<Notification>('notifications');
    return all
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    linkPath: string;
  }): Promise<Notification> {
    const item: Notification = {
      id: uid('ntf'),
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      linkPath: params.linkPath,
      read: false,
      createdAt: new Date().toISOString(),
    };
    return StorageService.put('notifications', item);
  },

  async markAsRead(notificationId: string): Promise<void> {
    const existing = await StorageService.getById<Notification>('notifications', notificationId);
    if (existing && !existing.read) {
      await StorageService.put('notifications', { ...existing, read: true });
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const userNotifs = await this.listByUser(userId);
    const updated = userNotifs.filter((n) => !n.read).map((n) => ({ ...n, read: true }));
    if (updated.length > 0) {
      await StorageService.putMany('notifications', updated);
    }
  },
};

// ============================================================================
// AUTH & USER SERVICE
// ============================================================================
export interface RegisterClientPayload {
  fullName: string;
  organization?: string;
  email: string;
  password: string;
  phone: string;
  acceptedTerms: boolean;
}

export interface RegisterPartnerPayload {
  legalName: string;
  companyName?: string;
  cpfCnpj: string;
  city: string;
  state: string;
  email: string;
  password: string;
  phone: string;
  acceptedTerms: boolean;
}

export const AuthService = {
  async getCurrentUser(): Promise<User | null> {
    const id = StorageService.getSessionUserId();
    if (!id) return null;
    const user = await StorageService.getById<User>('users', id);
    return user || null;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    const users = await StorageService.getAll<User>('users');
    return users.find((u) => u.email.toLowerCase() === normalized);
  },

  async registerClient(payload: RegisterClientPayload): Promise<User> {
    const existing = await this.findByEmail(payload.email);
    if (existing) {
      throw new Error('Este endereço de e-mail já está cadastrado na plataforma.');
    }
    const now = new Date().toISOString();
    const token = `SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const user: User = {
      id: uid('usr-cli'),
      role: UserRole.CLIENT,
      email: payload.email.trim().toLowerCase(),
      passwordHash: payload.password,
      phone: payload.phone,
      acceptedTerms: payload.acceptedTerms,
      emailVerified: false,
      emailVerificationToken: token,
      createdAt: now,
      updatedAt: now,
      clientProfile: {
        fullName: payload.fullName.trim(),
        organization: payload.organization?.trim() || '',
      },
    };
    await StorageService.put('users', user);
    return user;
  },

  async registerPartner(payload: RegisterPartnerPayload): Promise<User> {
    const existing = await this.findByEmail(payload.email);
    if (existing) {
      throw new Error('Este endereço de e-mail já está cadastrado na plataforma.');
    }
    const now = new Date().toISOString();
    const token = `SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const user: User = {
      id: uid('usr-par'),
      role: UserRole.PARTNER,
      email: payload.email.trim().toLowerCase(),
      passwordHash: payload.password,
      phone: payload.phone,
      acceptedTerms: payload.acceptedTerms,
      emailVerified: false,
      emailVerificationToken: token,
      createdAt: now,
      updatedAt: now,
      partnerProfile: {
        legalName: payload.legalName.trim(),
        companyName: payload.companyName?.trim() || payload.legalName.trim(),
        cpfCnpj: payload.cpfCnpj,
        city: payload.city.trim() || 'São Paulo',
        state: payload.state.trim().toUpperCase() || 'SP',
        rating: 5.0,
        completedJobsCount: 0,
      },
    };
    await StorageService.put('users', user);
    return user;
  },

  async confirmSimulatedEmail(email: string, token?: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('Conta não localizada para confirmação.');
    }
    if (token && user.emailVerificationToken && token.trim() !== user.emailVerificationToken) {
      throw new Error('Código de verificação demonstrativo inválido.');
    }
    const updated: User = {
      ...user,
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    };
    await StorageService.put('users', updated);
    StorageService.setSessionUserId(updated.id);
    return updated;
  },

  async login(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user || user.passwordHash !== password) {
      throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
    }
    if (!user.emailVerified) {
      const err = new Error('EMAIL_NOT_VERIFIED');
      (err as Error & { email?: string }).email = user.email;
      throw err;
    }
    StorageService.setSessionUserId(user.id);
    return user;
  },

  async loginById(userId: string): Promise<User> {
    const user = await StorageService.getById<User>('users', userId);
    if (!user) throw new Error('Usuário demonstrativo não encontrado.');
    StorageService.setSessionUserId(user.id);
    return user;
  },

  logout(): void {
    StorageService.setSessionUserId(null);
  },

  async updateProfile(userId: string, patch: Partial<User>): Promise<User> {
    const current = await StorageService.getById<User>('users', userId);
    if (!current) throw new Error('Usuário não encontrado.');
    const updated: User = {
      ...current,
      ...patch,
      id: current.id,
      role: current.role,
      email: current.email,
      updatedAt: new Date().toISOString(),
    };
    return StorageService.put('users', updated);
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const current = await StorageService.getById<User>('users', userId);
    if (!current) throw new Error('Usuário não encontrado.');
    if (current.passwordHash !== currentPassword) {
      throw new Error('A senha atual informada está incorreta.');
    }
    await StorageService.put('users', {
      ...current,
      passwordHash: newPassword,
      updatedAt: new Date().toISOString(),
    });
  },

  getDisplayName(user: User): string {
    if (user.role === UserRole.CLIENT) {
      return user.clientProfile?.fullName || user.email;
    }
    return (
      user.partnerProfile?.companyName ||
      user.partnerProfile?.legalName ||
      user.email
    );
  },
};

// ============================================================================
// EQUIPMENT SERVICE
// ============================================================================
export const EquipmentService = {
  async listAll(): Promise<Equipment[]> {
    const all = await StorageService.getAll<Equipment>('equipments');
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async listByPartner(partnerId: string): Promise<Equipment[]> {
    const all = await this.listAll();
    return all.filter((e) => e.partnerId === partnerId);
  },

  async getById(id: string): Promise<Equipment | undefined> {
    return StorageService.getById<Equipment>('equipments', id);
  },

  async create(
    partner: User,
    input: Omit<
      Equipment,
      'id' | 'partnerId' | 'partnerName' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Equipment> {
    const now = new Date().toISOString();
    const photos =
      input.photos && input.photos.length > 0
        ? input.photos
        : [DEFAULT_EQUIPMENT_PHOTOS[input.technology]];

    const item: Equipment = {
      ...input,
      photos,
      id: uid('eq'),
      partnerId: partner.id,
      partnerName: AuthService.getDisplayName(partner),
      createdAt: now,
      updatedAt: now,
    };
    return StorageService.put('equipments', item);
  },

  async update(id: string, patch: Partial<Equipment>): Promise<Equipment> {
    const existing = await StorageService.getById<Equipment>('equipments', id);
    if (!existing) throw new Error('Equipamento não localizado.');
    const updated: Equipment = {
      ...existing,
      ...patch,
      id: existing.id,
      partnerId: existing.partnerId,
      updatedAt: new Date().toISOString(),
    };
    return StorageService.put('equipments', updated);
  },

  async updateIdleHours(
    id: string,
    availableHours: number,
    status?: EquipmentStatus
  ): Promise<Equipment> {
    const clamped = Math.max(0, Math.round(availableHours * 10) / 10);
    const computedStatus =
      status ||
      (clamped === 0
        ? EquipmentStatus.BUSY
        : clamped <= 15
        ? EquipmentStatus.PARTIALLY_AVAILABLE
        : EquipmentStatus.AVAILABLE);
    return this.update(id, { availableHours: clamped, status: computedStatus });
  },

  async delete(id: string): Promise<void> {
    await StorageService.delete('equipments', id);
  },
};

// ============================================================================
// PROJECT & FILE SERVICE
// ============================================================================
export interface UploadedFileDraft {
  file: File | Blob;
  fileName: string;
}

export const ProjectService = {
  async listAll(): Promise<Project[]> {
    const all = await StorageService.getAll<Project>('projects');
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listByClient(clientId: string): Promise<Project[]> {
    const all = await this.listAll();
    return all.filter((p) => p.clientId === clientId);
  },

  async listForPartner(partnerId: string): Promise<Project[]> {
    const all = await this.listAll();
    return all.filter(
      (p) => !p.targetPartnerId || p.targetPartnerId === partnerId
    );
  },

  async getById(id: string): Promise<Project | undefined> {
    return StorageService.getById<Project>('projects', id);
  },

  async createProject(
    client: User,
    data: {
      title: string;
      description: string;
      quantity: number;
      desiredMaterial: string;
      desiredColor: string;
      dimensionsApproxMm: string;
      desiredTechnology: PrintTechnology;
      desiredDeadline: string;
      technicalNotes?: string;
      targetEquipmentId?: string;
      targetPartnerId?: string;
    },
    fileDrafts: UploadedFileDraft[]
  ): Promise<Project> {
    const now = new Date().toISOString();
    const projectId = uid('prj');
    const savedFiles: ProjectFile[] = [];

    for (const draft of fileDrafts) {
      const ext = (draft.fileName.split('.').pop() || 'BIN').toUpperCase();
      const blobKey = uid('blob');
      const mimeType = draft.file.type || 'application/octet-stream';
      await StorageService.saveFileBlob(blobKey, draft.file, draft.fileName, mimeType);

      savedFiles.push({
        id: uid('fil'),
        projectId,
        fileName: draft.fileName,
        extension: ext,
        mimeType,
        sizeBytes: draft.file.size,
        blobKey,
        uploadedByUserId: client.id,
        uploadedAt: now,
        category: ['STL', 'OBJ', '3MF', 'STEP', 'STP', 'DXF'].includes(ext)
          ? 'ORIGINAL_CAD'
          : 'SPECIFICATION',
      });
    }

    const project: Project = {
      id: projectId,
      clientId: client.id,
      clientName: AuthService.getDisplayName(client),
      targetEquipmentId: data.targetEquipmentId || undefined,
      targetPartnerId: data.targetPartnerId || undefined,
      title: data.title.trim(),
      description: data.description.trim(),
      quantity: Math.max(1, Math.round(data.quantity)),
      desiredMaterial: data.desiredMaterial,
      desiredColor: data.desiredColor.trim() || 'Padrão Técnico',
      dimensionsApproxMm: data.dimensionsApproxMm.trim(),
      desiredTechnology: data.desiredTechnology,
      desiredDeadline: data.desiredDeadline,
      technicalNotes: data.technicalNotes?.trim() || '',
      files: savedFiles,
      status: ProjectStatus.OPEN,
      createdAt: now,
      updatedAt: now,
    };

    await StorageService.put('projects', project);

    // Notificar parceiro específico ou parceiros com a tecnologia compatível
    const users = await StorageService.getAll<User>('users');
    const equipments = await StorageService.getAll<Equipment>('equipments');
    const targetPartners = users.filter((u) => {
      if (u.role !== UserRole.PARTNER) return false;
      if (project.targetPartnerId) return u.id === project.targetPartnerId;
      return equipments.some(
        (eq) => eq.partnerId === u.id && eq.technology === project.desiredTechnology
      );
    });

    for (const partner of targetPartners) {
      await NotificationService.create({
        userId: partner.id,
        type: NotificationType.NEW_REQUEST,
        title: 'Nova solicitação de impressão recebida',
        message: `${project.clientName} publicou "${project.title}" (${project.desiredTechnology} · ${project.quantity} un.).`,
        linkPath: '/parceiro/solicitacoes',
      });
    }

    return project;
  },

  async triggerFileDownload(file: ProjectFile): Promise<void> {
    const stored = await StorageService.getFileBlob(file.blobKey);
    const blob =
      stored?.blob ||
      new Blob(
        [
          `Arquivo demonstrativo ICM\nNome: ${file.fileName}\nFormato: ${file.extension}\nTamanho: ${file.sizeBytes} bytes`,
        ],
        { type: 'text/plain' }
      );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  },

  async downloadAllProjectFiles(files: ProjectFile[]): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      await new Promise((r) => window.setTimeout(r, i * 180));
      await this.triggerFileDownload(files[i]);
    }
  },
};

// ============================================================================
// QUOTE SERVICE
// ============================================================================
export interface QuoteCalculationInput {
  estimatedPrintHours: number;
  prepHours: number;
  hourlyRateBrl: number;
  materialCostBrl: number;
  operationCostBrl: number;
  additionalCostsBrl: number;
}

export const QuoteService = {
  calculateTotal(input: QuoteCalculationInput): {
    machineSubtotal: number;
    totalValueBrl: number;
    items: QuoteItem[];
  } {
    const totalHours = Math.max(0, Number(input.estimatedPrintHours) || 0) +
      Math.max(0, Number(input.prepHours) || 0);
    const rate = Math.max(0, Number(input.hourlyRateBrl) || 0);
    const machineSubtotal = Math.round(totalHours * rate * 100) / 100;
    const mat = Math.max(0, Number(input.materialCostBrl) || 0);
    const op = Math.max(0, Number(input.operationCostBrl) || 0);
    const add = Math.max(0, Number(input.additionalCostsBrl) || 0);
    const totalValueBrl = Math.round((machineSubtotal + mat + op + add) * 100) / 100;

    const items: QuoteItem[] = [
      {
        id: 'item-machine',
        description: `Capacidade produtiva (${totalHours.toFixed(1)}h × R$ ${rate.toFixed(2)})`,
        quantity: totalHours,
        unitCostBrl: rate,
        subtotalBrl: machineSubtotal,
      },
      {
        id: 'item-material',
        description: 'Custo de matéria-prima / filamento / resina / pó',
        quantity: 1,
        unitCostBrl: mat,
        subtotalBrl: mat,
      },
      {
        id: 'item-op',
        description: 'Operação técnica, acabamento e custos complementares',
        quantity: 1,
        unitCostBrl: op + add,
        subtotalBrl: Math.round((op + add) * 100) / 100,
      },
    ];

    return { machineSubtotal, totalValueBrl, items };
  },

  async listAll(): Promise<Quote[]> {
    const all = await StorageService.getAll<Quote>('quotes');
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async listByClient(clientId: string): Promise<Quote[]> {
    const all = await this.listAll();
    return all.filter((q) => q.clientId === clientId && q.status !== QuoteStatus.DRAFT);
  },

  async listByPartner(partnerId: string): Promise<Quote[]> {
    const all = await this.listAll();
    return all.filter((q) => q.partnerId === partnerId);
  },

  async saveOrSendQuote(
    partner: User,
    payload: {
      existingQuoteId?: string;
      project: Project;
      equipment: Equipment;
      materialUsed: string;
      quantity: number;
      estimatedPrintHours: number;
      prepHours: number;
      hourlyRateBrl: number;
      materialCostBrl: number;
      operationCostBrl: number;
      additionalCostsBrl: number;
      productionLeadDays: number;
      deliveryLeadDays: number;
      technicalNotes: string;
      sendNow: boolean;
    }
  ): Promise<Quote> {
    const now = new Date().toISOString();
    const calc = this.calculateTotal(payload);
    const status = payload.sendNow ? QuoteStatus.SENT : QuoteStatus.DRAFT;

    let quoteId = payload.existingQuoteId || uid('qt');
    let createdAt = now;

    if (payload.existingQuoteId) {
      const prev = await StorageService.getById<Quote>('quotes', payload.existingQuoteId);
      if (prev) {
        if (prev.status === QuoteStatus.APPROVED) {
          throw new Error('Não é possível editar um orçamento que já foi aprovado.');
        }
        quoteId = prev.id;
        createdAt = prev.createdAt;
      }
    }

    const quote: Quote = {
      id: quoteId,
      projectId: payload.project.id,
      projectTitle: payload.project.title,
      clientId: payload.project.clientId,
      clientName: payload.project.clientName,
      partnerId: partner.id,
      partnerName: AuthService.getDisplayName(partner),
      equipmentId: payload.equipment.id,
      equipmentName: `${payload.equipment.name} (${payload.equipment.model})`,
      materialUsed: payload.materialUsed,
      quantity: payload.quantity,
      estimatedPrintHours: payload.estimatedPrintHours,
      prepHours: payload.prepHours,
      hourlyRateBrl: payload.hourlyRateBrl,
      materialCostBrl: payload.materialCostBrl,
      operationCostBrl: payload.operationCostBrl,
      additionalCostsBrl: payload.additionalCostsBrl,
      totalValueBrl: calc.totalValueBrl,
      productionLeadDays: payload.productionLeadDays,
      deliveryLeadDays: payload.deliveryLeadDays,
      technicalNotes: payload.technicalNotes.trim(),
      items: calc.items,
      status,
      createdAt,
      updatedAt: now,
    };

    await StorageService.put('quotes', quote);

    if (payload.sendNow) {
      if (payload.project.status === ProjectStatus.OPEN) {
        await StorageService.put('projects', {
          ...payload.project,
          status: ProjectStatus.IN_NEGOTIATION,
          updatedAt: now,
        });
      }

      await NotificationService.create({
        userId: payload.project.clientId,
        type: NotificationType.QUOTE_SENT,
        title: 'Nova proposta comercial recebida',
        message: `${quote.partnerName} enviou um orçamento para "${payload.project.title}".`,
        linkPath: '/cliente/orcamentos',
      });
    }

    return quote;
  },

  async cancelQuote(quoteId: string): Promise<void> {
    const existing = await StorageService.getById<Quote>('quotes', quoteId);
    if (!existing) throw new Error('Orçamento não encontrado.');
    if (existing.status === QuoteStatus.APPROVED) {
      throw new Error('Orçamentos aprovados não podem ser cancelados.');
    }
    await StorageService.put('quotes', {
      ...existing,
      status: QuoteStatus.CANCELLED,
      updatedAt: new Date().toISOString(),
    });
  },

  async rejectQuote(quoteId: string, reason?: string): Promise<void> {
    const existing = await StorageService.getById<Quote>('quotes', quoteId);
    if (!existing) throw new Error('Orçamento não encontrado.');
    await StorageService.put('quotes', {
      ...existing,
      status: QuoteStatus.REJECTED,
      rejectionReason: reason?.trim() || 'Proposta declinada pelo cliente.',
      updatedAt: new Date().toISOString(),
    });

    await NotificationService.create({
      userId: existing.partnerId,
      type: NotificationType.QUOTE_REJECTED,
      title: 'Proposta recusada pelo cliente',
      message: `Sua proposta para "${existing.projectTitle}" não foi aprovada.`,
      linkPath: '/parceiro/orcamentos',
    });
  },

  async approveQuoteWithEscrow(
    client: User,
    quoteId: string,
    simulatedMethod: 'PIX Corporativo (Simulado)' | 'Boleto Escrow (Simulado)' | 'Cartão Empresarial (Simulado)'
  ): Promise<Order> {
    const quote = await StorageService.getById<Quote>('quotes', quoteId);
    if (!quote) throw new Error('Orçamento não encontrado.');
    if (quote.status === QuoteStatus.APPROVED) {
      throw new Error('Este orçamento já foi aprovado anteriormente.');
    }

    const project = await StorageService.getById<Project>('projects', quote.projectId);
    if (!project) throw new Error('Projeto associado não encontrado.');

    const equipment = await StorageService.getById<Equipment>('equipments', quote.equipmentId);
    const now = new Date().toISOString();

    // 1. Marcar proposta aprovada e rejeitar concorrentes pendentes do mesmo projeto
    const allQuotes = await this.listAll();
    const siblingUpdates: Quote[] = [];
    for (const q of allQuotes) {
      if (q.projectId === quote.projectId) {
        if (q.id === quote.id) {
          siblingUpdates.push({ ...q, status: QuoteStatus.APPROVED, updatedAt: now });
        } else if (q.status === QuoteStatus.SENT) {
          siblingUpdates.push({
            ...q,
            status: QuoteStatus.REJECTED,
            rejectionReason: 'Outra proposta comercial foi selecionada para o lote.',
            updatedAt: now,
          });
        }
      }
    }
    await StorageService.putMany('quotes', siblingUpdates);

    // 2. Atualizar status do projeto
    await StorageService.put('projects', {
      ...project,
      status: ProjectStatus.APPROVED,
      updatedAt: now,
    });

    // 3. Abater horas ociosas reservadas no equipamento
    if (equipment) {
      const reservedHours = quote.estimatedPrintHours + quote.prepHours;
      const remaining = Math.max(0, equipment.availableHours - reservedHours);
      await EquipmentService.updateIdleHours(equipment.id, remaining);
    }

    // 4. Gerar Pedido com Linha do Tempo + Pagamento em Escrow Simulado
    const totalLeadDays = quote.productionLeadDays + quote.deliveryLeadDays;
    const estDate = new Date(Date.now() + totalLeadDays * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const orderId = uid('ord');
    const codeNumber = String(Math.floor(1000 + Math.random() * 9000));
    const orderCode = `ICM-2026-${codeNumber}`;
    const platformFee = Math.round(quote.totalValueBrl * 0.08 * 100) / 100;
    const partnerNet = Math.round((quote.totalValueBrl - platformFee) * 100) / 100;

    const clientName = AuthService.getDisplayName(client);

    const order: Order = {
      id: orderId,
      code: orderCode,
      projectId: project.id,
      projectTitle: project.title,
      quoteId: quote.id,
      clientId: client.id,
      clientName,
      partnerId: quote.partnerId,
      partnerName: quote.partnerName,
      equipmentId: quote.equipmentId,
      equipmentName: quote.equipmentName,
      technology: equipment?.technology || project.desiredTechnology,
      material: quote.materialUsed,
      quantity: quote.quantity,
      totalValueBrl: quote.totalValueBrl,
      estimatedDeliveryDate: estDate,
      currentStatus: OrderStatus.ESCROW_PAYMENT,
      productionNotes: 'Aguardando início da preparação de máquina pelo parceiro.',
      timeline: [
        {
          id: uid('tl'),
          status: OrderStatus.WAITING_APPROVAL,
          label: 'Aguardando aprovação',
          description: `Proposta comercial aprovada por ${clientName}.`,
          updatedByUserId: client.id,
          updatedByName: clientName,
          updatedByRole: UserRole.CLIENT,
          timestamp: now,
        },
        {
          id: uid('tl'),
          status: OrderStatus.ESCROW_PAYMENT,
          label: 'Pagamento em escrow',
          description: `Reserva simulada de R$ ${quote.totalValueBrl.toFixed(2)} confirmada via ${simulatedMethod}. Valor retido em garantia até conclusão do pedido.`,
          updatedByUserId: client.id,
          updatedByName: clientName,
          updatedByRole: UserRole.CLIENT,
          timestamp: new Date(Date.now() + 1000).toISOString(),
        },
      ],
      paymentSimulation: {
        id: uid('pay'),
        orderId,
        amountBrl: quote.totalValueBrl,
        platformFeeBrl: platformFee,
        partnerNetBrl: partnerNet,
        status: PaymentEscrowStatus.RESERVED_IN_ESCROW,
        simulatedMethod,
        transactionCode: `SIM-ESCROW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        reservedAt: now,
        disclaimer:
          'Operação demonstrativa: valores simulados localmente sem movimentação financeira bancária real.',
      },
      complementaryFiles: [],
      createdAt: now,
      updatedAt: now,
    };

    await StorageService.put('orders', order);

    // Notificações bilaterais
    await NotificationService.create({
      userId: quote.partnerId,
      type: NotificationType.QUOTE_APPROVED,
      title: `Orçamento aprovado — Pedido ${orderCode}`,
      message: `${clientName} aprovou sua proposta e o pagamento simulado está retido em escrow. Você já pode iniciar a produção.`,
      linkPath: `/parceiro/pedido/${order.id}`,
    });

    await NotificationService.create({
      userId: client.id,
      type: NotificationType.ESCROW_CONFIRMED,
      title: `Garantia Escrow confirmada — ${orderCode}`,
      message: `Seu pedido para "${project.title}" foi aberto e aguarda início da impressão pelo parceiro.`,
      linkPath: `/cliente/pedido/${order.id}`,
    });

    return order;
  },
};

// ============================================================================
// ORDER & TIMELINE SERVICE
// ============================================================================
export const ORDER_STAGE_SEQUENCE: {
  status: OrderStatus;
  label: string;
  helperText: string;
}[] = [
  {
    status: OrderStatus.WAITING_APPROVAL,
    label: 'Aguardando aprovação',
    helperText: 'Orçamento enviado e aprovado pelo cliente.',
  },
  {
    status: OrderStatus.ESCROW_PAYMENT,
    label: 'Pagamento em escrow',
    helperText: 'Valor reservado em conta garantia simulada.',
  },
  {
    status: OrderStatus.IN_PRODUCTION,
    label: 'Em produção',
    helperText: 'Parceiro iniciou a fabricação aditiva das peças.',
  },
  {
    status: OrderStatus.QUALITY_CONTROL,
    label: 'Controle de qualidade',
    helperText: 'Inspeção dimensional, pós-cura ou acabamento técnico.',
  },
  {
    status: OrderStatus.PACKAGING,
    label: 'Embalagem',
    helperText: 'Acondicionamento técnico para expedição segura.',
  },
  {
    status: OrderStatus.COMPLETED_SHIPPED,
    label: 'Concluído/Enviado',
    helperText: 'Pedido expedido e operação em escrow finalizada.',
  },
];

export const OrderService = {
  async listAll(): Promise<Order[]> {
    const all = await StorageService.getAll<Order>('orders');
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async listByClient(clientId: string): Promise<Order[]> {
    const all = await this.listAll();
    return all.filter((o) => o.clientId === clientId);
  },

  async listByPartner(partnerId: string): Promise<Order[]> {
    const all = await this.listAll();
    return all.filter((o) => o.partnerId === partnerId);
  },

  async getById(id: string): Promise<Order | undefined> {
    return StorageService.getById<Order>('orders', id);
  },

  getNextAllowedStage(current: OrderStatus): (typeof ORDER_STAGE_SEQUENCE)[number] | null {
    const idx = ORDER_STAGE_SEQUENCE.findIndex((s) => s.status === current);
    if (idx < 0 || idx >= ORDER_STAGE_SEQUENCE.length - 1) return null;
    return ORDER_STAGE_SEQUENCE[idx + 1];
  },

  async advanceOrderStatus(params: {
    orderId: string;
    actor: User;
    nextStatus: OrderStatus;
    description: string;
    trackingCode?: string;
  }): Promise<Order> {
    const order = await StorageService.getById<Order>('orders', params.orderId);
    if (!order) throw new Error('Pedido não encontrado.');

    if (params.actor.role !== UserRole.PARTNER || params.actor.id !== order.partnerId) {
      throw new Error('Apenas o parceiro responsável pode avançar as etapas operacionais.');
    }

    const expectedNext = this.getNextAllowedStage(order.currentStatus);
    if (!expectedNext || expectedNext.status !== params.nextStatus) {
      throw new Error(
        'Transição de status inválida. Respeite a sequência operacional da linha do tempo.'
      );
    }

    const now = new Date().toISOString();
    const actorName = AuthService.getDisplayName(params.actor);

    const newEntry: OrderTimeline = {
      id: uid('tl'),
      status: params.nextStatus,
      label: expectedNext.label,
      description: params.description.trim() || expectedNext.helperText,
      updatedByUserId: params.actor.id,
      updatedByName: actorName,
      updatedByRole: params.actor.role,
      timestamp: now,
    };

    const isCompleted = params.nextStatus === OrderStatus.COMPLETED_SHIPPED;

    const updatedPayment = isCompleted
      ? {
          ...order.paymentSimulation,
          status: PaymentEscrowStatus.RELEASED_TO_PARTNER,
          releasedAt: now,
        }
      : order.paymentSimulation;

    const updatedOrder: Order = {
      ...order,
      currentStatus: params.nextStatus,
      productionNotes: params.description.trim() || order.productionNotes,
      trackingCode: params.trackingCode?.trim() || order.trackingCode,
      timeline: [...order.timeline, newEntry],
      paymentSimulation: updatedPayment,
      updatedAt: now,
    };

    await StorageService.put('orders', updatedOrder);

    // Sincronizar status do Projeto correspondente
    const project = await StorageService.getById<Project>('projects', order.projectId);
    if (project) {
      const nextProjectStatus = isCompleted
        ? ProjectStatus.COMPLETED
        : ProjectStatus.IN_PRODUCTION;
      await StorageService.put('projects', {
        ...project,
        status: nextProjectStatus,
        updatedAt: now,
      });
    }

    // Incrementar contador de serviços concluídos do parceiro
    if (isCompleted && params.actor.partnerProfile) {
      await AuthService.updateProfile(params.actor.id, {
        partnerProfile: {
          ...params.actor.partnerProfile,
          completedJobsCount: (params.actor.partnerProfile.completedJobsCount || 0) + 1,
        },
      });
    }

    // Notificar cliente
    await NotificationService.create({
      userId: order.clientId,
      type: isCompleted
        ? NotificationType.ORDER_COMPLETED
        : params.nextStatus === OrderStatus.IN_PRODUCTION
        ? NotificationType.PRODUCTION_STARTED
        : NotificationType.ORDER_UPDATED,
      title: isCompleted
        ? `Pedido ${order.code} concluído e enviado!`
        : `Atualização de etapa — ${order.code}`,
      message: `${actorName} atualizou o pedido para "${expectedNext.label}".`,
      linkPath: `/cliente/pedido/${order.id}`,
    });

    return updatedOrder;
  },

  async attachComplementaryFile(
    orderId: string,
    actor: User,
    file: File
  ): Promise<Order> {
    const order = await StorageService.getById<Order>('orders', orderId);
    if (!order) throw new Error('Pedido não encontrado.');
    const now = new Date().toISOString();
    const ext = (file.name.split('.').pop() || 'BIN').toUpperCase();
    const blobKey = uid('blob');
    await StorageService.saveFileBlob(
      blobKey,
      file,
      file.name,
      file.type || 'application/octet-stream'
    );

    const newFile: ProjectFile = {
      id: uid('fil'),
      projectId: order.projectId,
      fileName: file.name,
      extension: ext,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      blobKey,
      uploadedByUserId: actor.id,
      uploadedAt: now,
      category: 'COMPLEMENTARY',
    };

    const updated: Order = {
      ...order,
      complementaryFiles: [...order.complementaryFiles, newFile],
      updatedAt: now,
    };
    return StorageService.put('orders', updated);
  },
};

// ============================================================================
// CHAT MESSAGE SERVICE
// ============================================================================
export const MessageService = {
  async listByOrder(orderId: string, projectId?: string): Promise<Message[]> {
    const all = await StorageService.getAll<Message>('messages');
    return all
      .filter(
        (m) => m.orderId === orderId || (projectId && m.projectId === projectId)
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async sendMessage(params: {
    order: Order;
    sender: User;
    content: string;
  }): Promise<Message> {
    const trimmed = params.content.trim();
    if (!trimmed) throw new Error('Digite uma mensagem antes de enviar.');
    const senderName = AuthService.getDisplayName(params.sender);

    const msg: Message = {
      id: uid('msg'),
      orderId: params.order.id,
      projectId: params.order.projectId,
      senderId: params.sender.id,
      senderName,
      senderRole: params.sender.role,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    await StorageService.put('messages', msg);

    const recipientId =
      params.sender.role === UserRole.CLIENT
        ? params.order.partnerId
        : params.order.clientId;
    const recipientBase =
      params.sender.role === UserRole.CLIENT ? '/parceiro' : '/cliente';

    await NotificationService.create({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: `Nova mensagem em ${params.order.code}`,
      message: `${senderName}: "${trimmed.slice(0, 80)}${trimmed.length > 80 ? '...' : ''}"`,
      linkPath: `${recipientBase}/pedido/${params.order.id}`,
    });

    return msg;
  },
};
