import React, { useState } from 'react';
import { createStore } from '../api.js';

export default function CreateStoreForm({ onCreated }) {
  const [name, setName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await createStore({
        name,
        adminUsername,
        adminPassword,
        type: 'woocommerce',
      });
      setResult(res.data);
      onCreated();
    } catch (e) {
      const msg =
        e.response?.data?.error ||
        (e.code === 'ECONNABORTED'
          ? 'Provisioning timed out in UI. Check Stores list after a few seconds.'
          : e.message) ||
        'Failed';
      alert(msg);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Store name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="Admin username"
          value={adminUsername}
          onChange={e => setAdminUsername(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <input
          type="password"
          placeholder="Admin password"
          value={adminPassword}
          onChange={e => setAdminPassword(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Provisioning...' : 'Create WooCommerce Store'}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#e0ffe0', border: '1px solid green' }}>
          <strong>Store Ready!</strong><br/>
          Storefront: <a href={result.storefrontUrl} target="_blank" rel="noreferrer">{result.storefrontUrl}</a><br/>
          Admin: <a href={result.adminUrl} target="_blank" rel="noreferrer">{result.adminUrl}</a><br/>
          Username: {result.adminUsername}<br/>
          <strong>Password: {result.adminPassword} (SAVE IT NOW – shown only once)</strong><br/>
          {result.note}
        </div>
      )}
    </div>
  );
}
