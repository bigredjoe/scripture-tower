const React = require('react');

function placeholderFor(word) {
  return '_'.repeat(Math.max(3, word.length));
}

function PracticeText(props) {
  const { tokens, hiddenTokenIds } = props;

  return (
    <p style={{ fontSize: '1.2rem', lineHeight: 1.8 }}>
      {tokens.map((token) => {
        const shouldHide = token.isWord && hiddenTokenIds.indexOf(token.id) !== -1;
        return (
          <span key={token.id} style={{ whiteSpace: 'pre-wrap' }}>
            {shouldHide ? placeholderFor(token.value) : token.value}
          </span>
        );
      })}
    </p>
  );
}

module.exports = PracticeText;
