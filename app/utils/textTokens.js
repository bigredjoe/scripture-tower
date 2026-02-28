function tokenizeText(input) {
  const text = (input || '').replace(/\r\n/g, '\n');
  const parts = text.split(/(\s+|[^A-Za-z0-9']+)/g).filter(Boolean);

  return parts.map((value, idx) => ({
    id: idx,
    value,
    isWord: /^[A-Za-z0-9']+$/.test(value),
  }));
}

function getWordTokens(tokens) {
  return tokens.filter((token) => token.isWord);
}

module.exports = {
  tokenizeText,
  getWordTokens,
};
