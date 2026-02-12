import React from 'react';
import { deleteStore } from '../api.js';

export default function StoreList({ stores, onDeleted }) {
  const handleDelete = async (id) => {
    if (!confirm('Delete this store and all data?')) return;
    try {
      await deleteStore(id);
      onDeleted();
    } catch (e) {
      const msg =
        e.response?.data?.error ||
        (e.code === 'ECONNABORTED'
          ? 'Delete timed out in UI. Refresh the list to confirm status.'
          : e.message) ||
        'Delete failed';
      alert(msg);
    }
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f0f0f0' }}>
          <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID</th>
          <th>Status</th>
          <th>Created</th>
          <th>Storefront</th>
          <th>Admin</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {stores.length === 0 && <tr><td colSpan="6">No stores yet</td></tr>}
        {stores.map(store => (
          <tr key={store.id}>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{store.id}</td>
            <td>{store.status}</td>
            <td>{new Date(store.createdAt).toLocaleString()}</td>
            <td><a href={store.storefrontUrl} target="_blank" rel="noreferrer">Open</a></td>
            <td><a href={store.adminUrl} target="_blank" rel="noreferrer">Admin</a></td>
            <td><button onClick={() => handleDelete(store.id)}>Delete</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
