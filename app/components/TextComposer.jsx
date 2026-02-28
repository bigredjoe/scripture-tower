const React = require('react');

function TextComposer(props) {
  const { title, text, onTitleChange, onTextChange, onStart } = props;

  return (
    <div>
      <h1>Scripture Tower</h1>
      <p>Paste a verse, script, or poem and begin practicing right away.</p>

      <label>
        Title (optional)
        <br />
        <input value={title} onChange={onTitleChange} placeholder="Romans 8:28" />
      </label>

      <br />
      <br />

      <label>
        Text to memorize
        <br />
        <textarea
          value={text}
          onChange={onTextChange}
          rows="10"
          cols="70"
          placeholder="Paste your text here..."
        />
      </label>

      <br />
      <button onClick={onStart} disabled={!text.trim()}>
        Start practice
      </button>
    </div>
  );
}

module.exports = TextComposer;
