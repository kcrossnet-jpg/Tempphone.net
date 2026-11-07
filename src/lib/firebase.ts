import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PhoneTicket, SmsMessage, MailTicket, MailMessage, UserProfile, PaymentReceipt, CallRecording, ForwardedEmail } from '../types';

// Initialize Firebase app singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (using custom databaseId from config if provided)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validate connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline. Check connection or project quota.');
    }
  }
}
testConnection().catch(() => {});

// Authentication Helpers
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Persist / update user profile in Firestore
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore user profile update deferred:', err);
  }

  return user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// Subscribe to Auth state changes
export function onAuthUserChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Convert Firestore timestamp to Date
function toDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val.toDate && typeof val.toDate === 'function') return val.toDate();
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

// Firestore persistence for Phone Tickets
export async function savePhoneTicketToFirestore(userId: string, ticket: PhoneTicket, userEmail?: string) {
  try {
    const effectiveEmail = (userEmail || ticket.userEmail || '').trim().toLowerCase();
    const docId = ticket.ticketNo;
    const ticketRef = doc(db, 'phoneTickets', docId);
    await setDoc(ticketRef, {
      ...ticket,
      userId,
      userEmail: effectiveEmail,
      issuedAt: Timestamp.fromDate(new Date(ticket.issuedAt)),
      expiresAt: Timestamp.fromDate(new Date(ticket.expiresAt))
    }, { merge: true });

    if (userId) {
      await setDoc(doc(db, 'phoneTickets', `${userId}_${ticket.ticketNo}`), {
        ...ticket,
        userId,
        userEmail: effectiveEmail,
        issuedAt: Timestamp.fromDate(new Date(ticket.issuedAt)),
        expiresAt: Timestamp.fromDate(new Date(ticket.expiresAt))
      }, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('Error saving phone ticket to Firestore:', err);
  }
}

export async function loadPhoneTicketsFromFirestore(userId?: string, userEmail?: string): Promise<PhoneTicket[]> {
  try {
    const ticketsMap = new Map<string, PhoneTicket>();

    const parsePhoneDoc = (data: any): PhoneTicket => ({
      ticketNo: data.ticketNo,
      userId: data.userId,
      userEmail: data.userEmail,
      countryIso: data.countryIso,
      areaCode: data.areaCode,
      fullNumber: data.fullNumber,
      days: data.days,
      rate: data.rate,
      callRecording: data.callRecording,
      addOns: data.addOns || { callRecording: data.callRecording },
      issuedAt: toDate(data.issuedAt),
      expiresAt: toDate(data.expiresAt),
      isLive: data.isLive ?? true
    });

    // 1. Query by userId if provided
    if (userId) {
      try {
        const qUser = query(collection(db, 'phoneTickets'), where('userId', '==', userId));
        const snapUser = await getDocs(qUser);
        snapUser.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.ticketNo) {
            ticketsMap.set(data.ticketNo, parsePhoneDoc(data));
          }
        });
      } catch (err) {
        console.warn('User ID query notice:', err);
      }
    }

    // 2. Query by userEmail (case-insensitive normalized)
    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const rawEmail = userEmail.trim();
      const searchTerms = [cleanEmail];
      if (rawEmail !== cleanEmail) {
        searchTerms.push(rawEmail);
      }

      for (const term of searchTerms) {
        try {
          const qEmail = query(collection(db, 'phoneTickets'), where('userEmail', '==', term));
          const snapEmail = await getDocs(qEmail);
          snapEmail.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.ticketNo && !ticketsMap.has(data.ticketNo)) {
              ticketsMap.set(data.ticketNo, parsePhoneDoc(data));
            }
          });
        } catch (err) {
          console.warn('Email query term notice:', err);
        }
      }

      // Comprehensive fallback if still empty or to catch any legacy casing
      try {
        const allSnap = await getDocs(collection(db, 'phoneTickets'));
        allSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.ticketNo &&
            data.userEmail &&
            typeof data.userEmail === 'string' &&
            data.userEmail.trim().toLowerCase() === cleanEmail &&
            !ticketsMap.has(data.ticketNo)
          ) {
            ticketsMap.set(data.ticketNo, parsePhoneDoc(data));
          }
        });
      } catch (err) {
        console.warn('All-tickets scan fallback notice:', err);
      }
    }

    return Array.from(ticketsMap.values());
  } catch (err) {
    console.warn('Error fetching phone tickets from Firestore:', err);
    return [];
  }
}

export async function deletePhoneTicketFromFirestore(userId: string, ticketNo: string) {
  try {
    await deleteDoc(doc(db, 'phoneTickets', ticketNo)).catch(() => {});
    await deleteDoc(doc(db, 'phoneTickets', `${userId}_${ticketNo}`)).catch(() => {});
    const q = query(collection(db, 'phoneTickets'), where('ticketNo', '==', ticketNo));
    const snap = await getDocs(q);
    snap.forEach(async (d) => {
      await deleteDoc(d.ref).catch(() => {});
    });
  } catch (err) {
    console.warn('Error deleting phone ticket from Firestore:', err);
  }
}

// Firestore persistence for SMS Messages
export async function saveSmsMessageToFirestore(userId: string, ticketNo: string, sms: SmsMessage, userEmail?: string) {
  try {
    const effectiveEmail = (userEmail || '').trim().toLowerCase();
    const smsRef = doc(db, 'smsMessages', sms.id);
    await setDoc(smsRef, {
      ...sms,
      ticketNo,
      userId,
      userEmail: effectiveEmail,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving SMS to Firestore:', err);
  }
}

export async function loadSmsMessagesFromFirestore(userId?: string, userEmail?: string): Promise<Record<string, { inbox: SmsMessage[]; outbox: SmsMessage[] }>> {
  try {
    const result: Record<string, { inbox: SmsMessage[]; outbox: SmsMessage[] }> = {};
    const seenIds = new Set<string>();

    const parseMessage = (data: any): SmsMessage => ({
      id: data.id,
      from: data.from,
      to: data.to,
      body: data.body,
      timestamp: data.timestamp,
      otpCode: data.otpCode,
      isRead: data.isRead ?? true,
      isOutbound: data.isOutbound ?? false
    });

    const processDoc = (docSnap: any) => {
      const data = docSnap.data();
      const ticketNo = data.ticketNo;
      if (!ticketNo || seenIds.has(data.id)) return;
      seenIds.add(data.id);

      if (!result[ticketNo]) {
        result[ticketNo] = { inbox: [], outbox: [] };
      }
      const msg = parseMessage(data);
      if (msg.isOutbound) {
        result[ticketNo].outbox.push(msg);
      } else {
        result[ticketNo].inbox.push(msg);
      }
    };

    if (userId) {
      try {
        const qUser = query(collection(db, 'smsMessages'), where('userId', '==', userId));
        const snapUser = await getDocs(qUser);
        snapUser.forEach(processDoc);
      } catch (err) {
        console.warn('SMS user query notice:', err);
      }
    }

    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      try {
        const qEmail = query(collection(db, 'smsMessages'), where('userEmail', '==', cleanEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.forEach(processDoc);
      } catch (err) {
        console.warn('SMS email query notice:', err);
      }
    }

    return result;
  } catch (err) {
    console.warn('Error loading SMS from Firestore:', err);
    return {};
  }
}

// Firestore persistence for Mail Tickets
export async function saveMailTicketToFirestore(userId: string, ticket: MailTicket, userEmail?: string) {
  try {
    const effectiveEmail = (userEmail || ticket.userEmail || '').trim().toLowerCase();
    const docId = ticket.ticketNo;
    const ticketRef = doc(db, 'mailTickets', docId);
    await setDoc(ticketRef, {
      ...ticket,
      userId,
      userEmail: effectiveEmail,
      issuedAt: Timestamp.fromDate(new Date(ticket.issuedAt)),
      expiresAt: Timestamp.fromDate(new Date(ticket.expiresAt))
    }, { merge: true });

    if (userId) {
      await setDoc(doc(db, 'mailTickets', `${userId}_${ticket.ticketNo}`), {
        ...ticket,
        userId,
        userEmail: effectiveEmail,
        issuedAt: Timestamp.fromDate(new Date(ticket.issuedAt)),
        expiresAt: Timestamp.fromDate(new Date(ticket.expiresAt))
      }, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('Error saving mail ticket to Firestore:', err);
  }
}

export async function loadMailTicketsFromFirestore(userId?: string, userEmail?: string): Promise<MailTicket[]> {
  try {
    const ticketsMap = new Map<string, MailTicket>();

    const parseMailDoc = (data: any): MailTicket => ({
      ticketNo: data.ticketNo,
      userId: data.userId,
      userEmail: data.userEmail,
      username: data.username,
      domain: data.domain,
      fullAddress: data.fullAddress,
      durationMins: data.durationMins,
      rate: data.rate,
      forwardToInbox: data.forwardToInbox,
      issuedAt: toDate(data.issuedAt),
      expiresAt: toDate(data.expiresAt),
      isLive: data.isLive ?? true
    });

    if (userId) {
      try {
        const qUser = query(collection(db, 'mailTickets'), where('userId', '==', userId));
        const snapUser = await getDocs(qUser);
        snapUser.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.ticketNo) {
            ticketsMap.set(data.ticketNo, parseMailDoc(data));
          }
        });
      } catch (err) {
        console.warn('Mail ticket user query notice:', err);
      }
    }

    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const rawEmail = userEmail.trim();
      const searchTerms = [cleanEmail];
      if (rawEmail !== cleanEmail) {
        searchTerms.push(rawEmail);
      }

      for (const term of searchTerms) {
        try {
          const qEmail = query(collection(db, 'mailTickets'), where('userEmail', '==', term));
          const snapEmail = await getDocs(qEmail);
          snapEmail.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.ticketNo && !ticketsMap.has(data.ticketNo)) {
              ticketsMap.set(data.ticketNo, parseMailDoc(data));
            }
          });
        } catch (err) {
          console.warn('Mail query term notice:', err);
        }
      }

      // Fallback scan to match any legacy records
      try {
        const allSnap = await getDocs(collection(db, 'mailTickets'));
        allSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.ticketNo &&
            data.userEmail &&
            typeof data.userEmail === 'string' &&
            data.userEmail.trim().toLowerCase() === cleanEmail &&
            !ticketsMap.has(data.ticketNo)
          ) {
            ticketsMap.set(data.ticketNo, parseMailDoc(data));
          }
        });
      } catch (err) {
        console.warn('All-mail-tickets scan fallback notice:', err);
      }
    }

    return Array.from(ticketsMap.values());
  } catch (err) {
    console.warn('Error loading mail tickets from Firestore:', err);
    return [];
  }
}

export async function deleteMailTicketFromFirestore(userId: string, ticketNo: string) {
  try {
    await deleteDoc(doc(db, 'mailTickets', ticketNo)).catch(() => {});
    await deleteDoc(doc(db, 'mailTickets', `${userId}_${ticketNo}`)).catch(() => {});
    const q = query(collection(db, 'mailTickets'), where('ticketNo', '==', ticketNo));
    const snap = await getDocs(q);
    snap.forEach(async (d) => {
      await deleteDoc(d.ref).catch(() => {});
    });
  } catch (err) {
    console.warn('Error deleting mail ticket from Firestore:', err);
  }
}

// Convenient combined loader for email address
export async function loadAllActiveTicketsByEmail(email: string): Promise<{
  phoneTickets: PhoneTicket[];
  mailTickets: MailTicket[];
  smsMessages: Record<string, { inbox: SmsMessage[]; outbox: SmsMessage[] }>;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const [phoneTickets, mailTickets, smsMessages] = await Promise.all([
    loadPhoneTicketsFromFirestore(undefined, cleanEmail),
    loadMailTicketsFromFirestore(undefined, cleanEmail),
    loadSmsMessagesFromFirestore(undefined, cleanEmail)
  ]);
  return { phoneTickets, mailTickets, smsMessages };
}

export async function savePaymentReceiptToFirestore(receipt: PaymentReceipt, userId?: string) {
  try {
    const receiptRef = doc(db, 'paymentReceipts', receipt.id);
    await setDoc(receiptRef, {
      ...receipt,
      userId: userId || 'anonymous',
      timestamp: Timestamp.fromDate(new Date(receipt.timestamp))
    });
  } catch (err) {
    console.warn('Error saving payment receipt to Firestore:', err);
  }
}

export async function loadPaymentReceiptsFromFirestore(userId: string): Promise<PaymentReceipt[]> {
  try {
    const q = query(collection(db, 'paymentReceipts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const receipts: PaymentReceipt[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      receipts.push({
        id: data.id,
        userId: data.userId,
        userEmail: data.userEmail,
        amount: data.amount,
        amountInr: data.amountInr,
        ticketLabel: data.ticketLabel,
        paymentMethod: data.paymentMethod,
        authCode: data.authCode,
        transactionId: data.transactionId,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpayOrderId: data.razorpayOrderId,
        razorpaySignature: data.razorpaySignature,
        timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        status: data.status || 'captured',
        cardLast4: data.cardLast4,
        cardBrand: data.cardBrand
      });
    });
    return receipts;
  } catch (err) {
    console.warn('Error loading payment receipts from Firestore:', err);
    return [];
  }
}
// Firestore persistence for Call Recordings
export async function saveCallRecordingToFirestore(ticketNo: string, recording: CallRecording) {
  try {
    const recordingRef = doc(db, `phoneTickets/${ticketNo}/recordings`, recording.id);
    await setDoc(recordingRef, {
      ...recording,
      timestamp: Timestamp.fromDate(new Date(recording.timestamp))
    });
  } catch (err) {
    console.warn('Error saving call recording to Firestore:', err);
  }
}

export async function loadCallRecordingsFromFirestore(ticketNo: string): Promise<CallRecording[]> {
  try {
    const collRef = collection(db, `phoneTickets/${ticketNo}/recordings`);
    const snapshot = await getDocs(collRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        ticketNo: data.ticketNo,
        recordingUrl: data.recordingUrl,
        duration: data.duration,
        timestamp: toDate(data.timestamp)
      };
    });
  } catch (err) {
    console.warn('Error loading call recordings from Firestore:', err);
    return [];
  }
}

// Firestore persistence for Forwarded Emails
export async function saveForwardedEmailToFirestore(ticketNo: string, email: ForwardedEmail) {
  try {
    const emailRef = doc(db, `phoneTickets/${ticketNo}/forwardedEmails`, email.id);
    await setDoc(emailRef, {
      ...email,
      timestamp: Timestamp.fromDate(new Date(email.timestamp))
    });
  } catch (err) {
    console.warn('Error saving forwarded email to Firestore:', err);
  }
}

export async function loadForwardedEmailsFromFirestore(ticketNo: string): Promise<ForwardedEmail[]> {
  try {
    const collRef = collection(db, `phoneTickets/${ticketNo}/forwardedEmails`);
    const snapshot = await getDocs(collRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        ticketNo: data.ticketNo,
        from: data.from,
        subject: data.subject,
        body: data.body,
        timestamp: toDate(data.timestamp)
      };
    });
  } catch (err) {
    console.warn('Error loading forwarded emails from Firestore:', err);
    return [];
  }
}
