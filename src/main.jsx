import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

// Restore saved theme + font-size preferences
const savedTheme    = localStorage.getItem('st-theme')    || 'light';
const savedFontSize = localStorage.getItem('st-font-size') || 'medium';
document.documentElement.setAttribute('data-theme',     savedTheme);
document.documentElement.setAttribute('data-font-size', savedFontSize);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
