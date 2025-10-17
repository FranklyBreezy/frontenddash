import React, { useState, useEffect } from 'react';
import crypto from '../lib/client_crypto';
import { KeyManagerProps } from '../types';

const KeyManager: React.FC<KeyManagerProps> = ({ userId, setUserId, showMessage }) => {
  const [username, setUsername] = useState<string>('');
  const [p, setP] = useState<string>('61');
  const [q, setQ] = useState<string>('53');
  const [e, setE] = useState<string>('17');
  const [userKeyId, setUserKeyId] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      // Trim the stored user ID
      const trimmedId = storedUserId.trim();
      setUserId(trimmedId);
      
      // Use the trimmed ID to fetch the public key
      fetch(`${apiBaseUrl}/get_public_key/${trimmedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUserKeyId(data.username);
          }
        })
        .catch(err => console.error("Failed to fetch user key:", err));
    }
  }, [apiBaseUrl, setUserId]);

  function generateKeys() {
    try {
      const P = BigInt(p);
      const Q = BigInt(q);
      const E = BigInt(e);
      if (P === Q) throw new Error("p and q must be different prime numbers.");
      const N = P * Q;
      const phi = (P - 1n) * (Q - 1n);
      const [g, x] = crypto.egcd(E, phi);
      if (g !== 1n) throw new Error("e must be coprime to (p-1)*(q-1).");
      let d = x;
      if (d < 0n) d += phi;
      return { p: P, q: Q, e: E, n: N, d };
    } catch (err) {
      showMessage('Error', 'Failed to generate keys. Check p, q, and e values.');
      throw err;
    }
  }

  async function register() {
    if (!username) {
      showMessage('Error', 'Enter a username.');
      return;
    }
    try {
      const keys = generateKeys();
      const payload = { username, e: keys.e.toString(), n: keys.n.toString() };
      const response = await fetch(`${apiBaseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('privateKey', JSON.stringify({ d: keys.d.toString(), n: keys.n.toString() }));
        // Trim the user ID before setting state
        setUserId(data.user_id.trim());
        showMessage('Success', 'Registered successfully.');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      showMessage('Error', 'Register failed: ' + ((err as Error).message ?? 'unknown'));
    }
  }

  function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('privateKey');
    setUserId(null);
    setUserKeyId(null);
    showMessage('Success', 'Logged out and local keys cleared.');
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Key Manager</h2>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {userKeyId ? `username: ${userKeyId}` : 'not registered'}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="label">Username</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="alice" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="label">p (prime)</label>
            <input className="input" value={p} onChange={e => setP(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="label">q (prime)</label>
            <input className="input" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="label">e</label>
            <input className="input" value={e} onChange={e => setE(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <button className="btn btn-primary" onClick={register}>Register & Save Keys</button>
          <button className="btn btn-ghost" onClick={logout}>Clear Local Keys</button>
        </div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          Your User ID: <span className="text-indigo-500 break-all">{userId || 'not logged in'}</span>
        </div>
      </div>
    </div>
  );
};

export default KeyManager;