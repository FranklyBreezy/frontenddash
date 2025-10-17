import React, { useState, useMemo } from 'react';
import crypto from '../lib/client_crypto';
import { EncryptFormProps } from '../types';

// Define a type for the data structure sent to the /upload_ciphertext endpoint
interface UploadPayload {
  sender: string;
  ciphertext: string[];
  n_bitlen: number;
  recipient?: string;
  channel_id?: string;
}

const EncryptForm: React.FC<EncryptFormProps> = ({ userId, showMessage, currentView }) => {
  const [recipientId, setRecipientId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const isDmView = currentView.type === 'inbox';
  const isChannelView = currentView.type === 'channel';

  // Determine the target ID and type for display
  const targetType = isDmView ? 'Recipient ID' : (isChannelView ? 'Channel: ' + currentView.name : 'Target ID');
  const sendButtonText = isDmView ? 'Encrypt & Send DM' : 'Encrypt & Send to Channel';
  
  async function send() {
    if (!userId) {
      showMessage('Error', 'Please register or log in first.');
      return;
    }
    if (!message) {
      showMessage('Error', 'Enter a message.');
      return;
    }
    
    let targetKeyId: string | undefined;
    // Object to conditionally hold the recipient or channel ID
    const messageTarget: { recipient?: string; channel_id?: string } = {};
    
    // --- 1. Determine Recipient/Channel and Target Key ---
    
    if (isDmView) {
      // Direct Message (DM) logic
      if (!recipientId) {
        showMessage('Error', 'Enter recipient ID for DM.');
        return;
      }
      targetKeyId = recipientId.trim();
      messageTarget.recipient = targetKeyId;
      
    } else if (isChannelView) {
      // Channel Message logic: Encrypt for the sender so they can decrypt their own message back.
      targetKeyId = userId; // Encrypt to sender's public key for demo
      messageTarget.channel_id = currentView.id;
      
    } else {
      // Fallback or unselected state
      showMessage('Error', 'Select an Inbox or Channel before sending.');
      return;
    }

    try {
      // --- 2. Fetch Public Key (either recipient's or sender's) ---
      const keyIdToFetch = targetKeyId;
      const recipientKeyResponse = await fetch(`${apiBaseUrl}/get_public_key/${keyIdToFetch}`);
      const recipientKeyData = await recipientKeyResponse.json();
      
      if (!recipientKeyResponse.ok) {
        throw new Error(recipientKeyData.error || `Public key for ID ${keyIdToFetch} not found.`);
      }

      const publicKey = { e: recipientKeyData.e, n: recipientKeyData.n };
      
      // --- 3. Encrypt and Build Payload ---
      const ciphertext = crypto.customEncryptString(message, publicKey);
      const n_bitlen = BigInt(publicKey.n).toString(2).length;

      // Final payload declaration using 'const' and the defined interface
      const payload: UploadPayload = {
        sender: userId,
        ciphertext,
        n_bitlen,
        ...messageTarget // Spread the conditional recipient/channel_id fields
      };
      
      // --- 4. Send to Backend ---
      const sendResponse = await fetch(`${apiBaseUrl}/upload_ciphertext`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const sendData = await sendResponse.json();
      
      if (sendResponse.ok) {
        showMessage('Success', `Message sent. Target: ${targetType}. msg_id: ${sendData.msg_id}`);
        setMessage('');
        // NOTE: The message will appear shortly via polling in ChannelAndMessageView
      } else {
        throw new Error(sendData.error);
      }
    } catch (err) {
      console.error(err);
      showMessage('Error', 'Send failed: ' + ((err as Error).message ?? 'unknown'));
    }
  }

  // Determine input/target display based on the current view
  const targetDisplay = useMemo(() => {
    if (isChannelView) {
      return (
          <div className="space-y-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-700 dark:text-indigo-200 font-semibold border border-indigo-300 dark:border-indigo-700">
                  Sending to Channel: #{currentView.name} (ID: {currentView.id})
              </div>
          </div>
      );
    }
    return (
        <div>
            <label className="label">Recipient ID (DM)</label>
            <input 
                className="input" 
                value={recipientId} 
                onChange={e => setRecipientId(e.target.value)} 
                placeholder="Recipient user id" 
            />
        </div>
    );
  }, [isChannelView, recipientId, currentView]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        {isDmView ? 'Encrypt Direct Message' : `Encrypt for ${currentView.name}`}
      </h2>
      <div className="flex-grow flex flex-col space-y-4">
        
        {targetDisplay}
        
        <div className="flex-grow flex flex-col">
          <label className="label">Message</label>
          <textarea className="input flex-grow" value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Type your secret message..." />
        </div>
        <button className="btn btn-success mt-auto" onClick={send}>{sendButtonText}</button>
      </div>
    </div>
  );
};

export default EncryptForm;
