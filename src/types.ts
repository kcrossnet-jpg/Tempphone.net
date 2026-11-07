export interface CountryArea {
  code: string;
  city: string;
}

export interface Country {
  iso: string;
  flag: string;
  name: string;
  dial: string;
  areas: CountryArea[];
}

export interface SmsMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  otpCode?: string;
  isRead: boolean;
  isOutbound?: boolean;
}

export interface MailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  htmlBody?: string;
  timestamp: string;
  isRead: boolean;
  isOutbound?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  provider: 'Google Mail' | 'Email';
  avatar?: string;
}

export interface UserSession {
  success: boolean;
  token: string;
  user: UserProfile;
}

export type PageView = 'home' | 'ticket-phone' | 'ticket-mail' | 'login' | 'privacy-retention';

export interface PhoneAddOns {
  callRecording: boolean;
  whatsappShield?: boolean;
  autoForwardEmail?: boolean;
  burnOnFirstOtp?: boolean;
  privateDedicatedSim?: boolean;
}

export interface CallRecording {
  id: string;
  ticketNo: string;
  recordingUrl: string;
  duration: number;
  timestamp: Date;
}

export interface ForwardedEmail {
  id: string;
  ticketNo: string;
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
}

export interface PhoneTicket {
  ticketNo: string;
  userId?: string;
  userEmail?: string;
  countryIso: string;
  areaCode: string;
  fullNumber: string;
  days: number;
  rate: number;
  callRecording: boolean;
  addOns: PhoneAddOns;
  issuedAt: Date;
  expiresAt: Date;
  isLive: boolean;
}

export interface MailTicket {
  ticketNo: string;
  userId?: string;
  userEmail?: string;
  username: string;
  domain: string;
  fullAddress: string;
  durationMins: number;
  rate: number;
  forwardToInbox: boolean;
  issuedAt: Date;
  expiresAt: Date;
  isLive: boolean;
}

export interface PaymentReceipt {
  id: string;
  userId?: string;
  userEmail: string;
  amount: number;
  amountInr?: number;
  ticketLabel: string;
  paymentMethod: string;
  authCode: string;
  transactionId: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  timestamp: string;
  status: 'authenticated' | 'captured';
  cardLast4?: string;
  cardBrand?: string;
}
