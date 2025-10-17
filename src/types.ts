import { Dispatch, SetStateAction } from 'react';

// --- Global UI Props ---
export interface MessageBoxProps {
  title: string;
  message: string;
  onClose: () => void;
}

// --- Common Base Props for all major components ---
export interface CommonProps {
  userId: string | null;
  showMessage: (title: string, message: string) => void;
}

// --- Basic Crypto & Message Types ---
export interface PrivateKey {
  d: string;
  n: string;
}

export interface PublicKey {
  e: string;
  n: string;
}

export interface MessageItem {
  msg_id: string;
  sender: string;
  // Added fields used in the decryption view for display clarity
  decryptedText?: string;
  isDecrypted?: boolean;
}

// --- Channel & View Management Types ---
export interface PublicChannel {
  channel_id: string;
  name: string;
  creator_id?: string;
}

// Type to manage the current view (either Inbox/DMs or a specific Channel)
export type ViewType = { type: 'inbox' } | { type: 'channel', id: string, name: string };


// --- Component Props (updated using CommonProps) ---

export interface KeyManagerProps extends CommonProps {
  setUserId: Dispatch<SetStateAction<string | null>>;
}

export interface EncryptFormProps extends CommonProps {
  currentView: ViewType; // Needs to know the current target (DM or Channel)
}

// Replaces the old InboxProps, now handles both channel listing and message display
export interface ChannelMessageProps extends CommonProps {
  currentView: ViewType;
  setCurrentView: Dispatch<SetStateAction<ViewType>>;
}
