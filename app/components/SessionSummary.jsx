const React = require('react');

function SessionSummary(props) {
  const { title, round, hiddenPercent, elapsedSeconds, hintsUsed, typeScore, onRestart } = props;

  return (
    <div>
      <h2>Session complete</h2>
      <p><strong>Title:</strong> {title || 'Untitled passage'}</p>
      <p><strong>Rounds completed:</strong> {round}</p>
      <p><strong>Highest hidden percent:</strong> {hiddenPercent}%</p>
      <p><strong>Time:</strong> {elapsedSeconds}s</p>
      <p><strong>Hints used:</strong> {hintsUsed}</p>
      {typeScore !== null && <p><strong>Type-check similarity:</strong> {typeScore}%</p>}
      <button onClick={onRestart}>Practice another text</button>
    </div>
  );
}

module.exports = SessionSummary;
