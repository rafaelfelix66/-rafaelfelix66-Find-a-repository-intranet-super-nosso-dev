//frontend/src/App-simple.tsx
// App-simple.tsx - Versão simplificada para debug
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Componente de login simplificado
const SimpleLogin = () => {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#e60909' }}>Intranet Super Nosso</h1>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
          Bem-vindo ao portal de login da Intranet Super Nosso.
        </p>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email:
          </label>
          <input 
            type="email" 
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '16px'
            }} 
            placeholder="seu.email@supernosso.com"
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Senha:
          </label>
          <input 
            type="password" 
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '16px'
            }} 
            placeholder="********"
          />
        </div>
        <button 
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#e60909', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
};

// Página Not Found simplificada
const SimpleNotFound = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    padding: '20px',
    textAlign: 'center'
  }}>
    <h1 style={{ color: '#e60909', fontSize: '48px', marginBottom: '10px' }}>404</h1>
    <p style={{ fontSize: '18px', marginBottom: '20px' }}>Página não encontrada</p>
    <a 
      href="/" 
      style={{ 
        color: '#e60909',
        textDecoration: 'none',
        padding: '8px 16px',
        border: '1px solid #e60909',
        borderRadius: '4px'
      }}
    >
      Voltar para a Página Inicial
    </a>
  </div>
);

// App simplificado
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimpleLogin />} />
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="*" element={<SimpleNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;