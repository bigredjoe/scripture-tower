const React = require('react');

function PracticeControls(props) {
  const {
    round,
    hiddenPercent,
    checkMode,
    typedAttempt,
    onTypedAttemptChange,
    onModeChange,
    onRevealOne,
    onResetRound,
    onNextRound,
    onFinish,
  } = props;

  return (
    <div>
      <p>
        <strong>Round:</strong> {round} | <strong>Hidden:</strong> {hiddenPercent}%
      </p>

      <button onClick={onModeChange}>
        Mode: {checkMode === 'self' ? 'Self-check' : 'Type-check'}
      </button>{' '}
      <button onClick={onRevealOne}>Reveal one word</button>{' '}
      <button onClick={onResetRound}>Reset round</button>{' '}
      <button onClick={onNextRound}>Next round</button>{' '}
      <button onClick={onFinish}>Finish session</button>

      {checkMode === 'type' && (
        <div>
          <p>Type the full text from memory (forgiving punctuation/case check).</p>
          <textarea rows="5" cols="70" value={typedAttempt} onChange={onTypedAttemptChange} />
        </div>
      )}
    </div>
  );
}

module.exports = PracticeControls;
