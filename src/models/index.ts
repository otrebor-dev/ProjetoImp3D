export enum UserRole {
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
}

export enum PrintTechnology {
  FDM = 'FDM',
  SLA = 'SLA',
  SLS = 'SLS',
  DMLS = 'DMLS',
  MJF = 'MJF',
}

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  PARTIALLY_AVAILABLE = 'PARTIALLY_AVAILABLE',
  BUSY = 'BUSY',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ProjectStatus {
  OPEN = 'OPEN',
  IN_NEGOTIATION = 'IN_NEGOTIATION',
  APPROVED = 'APPROVED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum OrderStatus {
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  ESCROW_PAYMENT = 'ESCROW_PAYMENT',
  IN_PRODUCTION = 'IN_PRODUCTION',
  QUALITY_CONTROL = 'QUALITY_CONTROL',
  PACKAGING = 'PACKAGING',
  COMPLETED_SHIPPED = 'COMPLETED_SHIPPED',
}

export enum PaymentEscrowStatus {
  PENDING = 'PENDING',
  RESERVED_IN_ESCROW = 'RESERVED_IN_ESCROW',
  RELEASED_TO_PARTNER = 'RELEASED_TO_PARTNER',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  NEW_REQUEST = 'NEW_REQUEST',
  QUOTE_SENT = 'QUOTE_SENT',
  QUOTE_APPROVED = 'QUOTE_APPROVED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  ESCROW_CONFIRMED = 'ESCROW_CONFIRMED',
  PRODUCTION_STARTED = 'PRODUCTION_STARTED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
}

export interface Material {
  id: string;
  name: string;
  category: 'Polímero' | 'Resina' | 'Compósito' | 'Metal' | 'Elastômero';
  compatibleTechnologies: PrintTechnology[];
  colorOptions: string[];
  densityGcm3?: number;
}

export interface ClientProfile {
  fullName: string;
  organization?: string;
  department?: string;
  defaultShippingCity?: string;
}

export interface PartnerProfile {
  legalName: string;
  companyName?: string;
  cpfCnpj: string;
  city: string;
  state: string;
  bio?: string;
  rating?: number;
  completedJobsCount: number;
}

export interface User {
  id: string;
  role: UserRole;
  email: string;
  passwordHash: string;
  phone: string;
  acceptedTerms: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
  clientProfile?: ClientProfile;
  partnerProfile?: PartnerProfile;
}

export interface Equipment {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  manufacturer: string;
  model: string;
  technology: PrintTechnology;
  materials: string[];
  buildVolumeMm: {
    x: number;
    y: number;
    z: number;
  };
  precisionMicrons: number;
  availableHours: number;
  hourlyRateBrl: number;
  location: string;
  photos: string[];
  status: EquipmentStatus;
  description: string;
  technicalNotes?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  blobKey: string;
  uploadedByUserId: string;
  uploadedAt: string;
  category: 'ORIGINAL_CAD' | 'SPECIFICATION' | 'COMPLEMENTARY';
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  targetEquipmentId?: string;
  targetPartnerId?: string;
  title: string;
  description: string;
  quantity: number;
  desiredMaterial: string;
  desiredColor: string;
  dimensionsApproxMm: string;
  desiredTechnology: PrintTechnology;
  desiredDeadline: string;
  technicalNotes?: string;
  files: ProjectFile[];
  status: ProjectStatus;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitCostBrl: number;
  subtotalBrl: number;
}

export interface Quote {
  id: string;
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  partnerId: string;
  partnerName: string;
  equipmentId: string;
  equipmentName: string;
  materialUsed: string;
  quantity: number;
  estimatedPrintHours: number;
  prepHours: number;
  hourlyRateBrl: number;
  materialCostBrl: number;
  operationCostBrl: number;
  additionalCostsBrl: number;
  totalValueBrl: number;
  productionLeadDays: number;
  deliveryLeadDays: number;
  technicalNotes: string;
  rejectionReason?: string;
  items: QuoteItem[];
  status: QuoteStatus;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTimeline {
  id: string;
  status: OrderStatus;
  label: string;
  description: string;
  updatedByUserId: string;
  updatedByName: string;
  updatedByRole: UserRole;
  timestamp: string;
}

export interface PaymentSimulation {
  id: string;
  orderId: string;
  amountBrl: number;
  platformFeeBrl: number;
  partnerNetBrl: number;
  status: PaymentEscrowStatus;
  simulatedMethod: 'PIX Corporativo (Simulado)' | 'Boleto Escrow (Simulado)' | 'Cartão Empresarial (Simulado)';
  transactionCode: string;
  reservedAt?: string;
  releasedAt?: string;
  disclaimer: string;
}

export interface Order {
  id: string;
  code: string;
  projectId: string;
  projectTitle: string;
  quoteId: string;
  clientId: string;
  clientName: string;
  partnerId: string;
  partnerName: string;
  equipmentId: string;
  equipmentName: string;
  technology: PrintTechnology;
  material: string;
  quantity: number;
  totalValueBrl: number;
  estimatedDeliveryDate: string;
  currentStatus: OrderStatus;
  productionNotes?: string;
  trackingCode?: string;
  timeline: OrderTimeline[];
  paymentSimulation: PaymentSimulation;
  complementaryFiles: ProjectFile[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  orderId?: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkPath: string;
  read: boolean;
  createdAt: string;
}
