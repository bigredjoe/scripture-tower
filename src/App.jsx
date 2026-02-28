import React from 'react';
import { useMemorize } from './hooks/useMemorize.js';
import InputScreen    from './components/InputScreen.jsx';
import MemorizeScreen from './components/MemorizeScreen.jsx';
import styles from './App.module.css';

export default function App() {
  const memorize = useMemorize();

  return (
    <div className={styles.app}>
      {memorize.screen === 'input' ? (
        <InputScreen onStart={memorize.start} />
      ) : (
        <MemorizeScreen memorize={memorize} />
      )}
    </div>
  );
}
