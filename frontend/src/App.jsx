import React, { useState, useEffect } from 'react';
import { getStores } from './api.js';
import CreateStoreForm from './components/CreateStoreForm.jsx';
import StoreList from './components/StoreList.jsx';

function App() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await getStores();
      setStores(res.data);
    } catch (e) {
      alert('Failed to load stores');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
    const interval = setInterval(fetchStores, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Urumi Store Provisioning Dashboard</h1>
      <CreateStoreForm onCreated={fetchStores} />
      <h2>Stores {loading && '(loading...)'}</h2>
      <StoreList stores={stores} onDeleted={fetchStores} />
    </div>
  );
}

export default App;