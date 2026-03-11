import { useMemorize } from './hooks/useMemorize';
import InputScreen    from './components/InputScreen';
import MemorizeScreen from './components/MemorizeScreen';
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
