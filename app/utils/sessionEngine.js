const { getWordTokens } = require('./textTokens');

const HIDE_STEP = 0.15;

function getHiddenTokenIds(tokens, round) {
  const wordTokens = getWordTokens(tokens);
  const targetCount = Math.max(1, Math.floor(wordTokens.length * Math.min(0.9, round * HIDE_STEP)));

  const hidden = [];
  const stride = Math.max(2, Math.floor(wordTokens.length / Math.max(1, targetCount)));
  let cursor = round % stride;

  while (hidden.length < targetCount && hidden.length < wordTokens.length) {
    const token = wordTokens[cursor % wordTokens.length];
    if (hidden.indexOf(token.id) === -1) {
      hidden.push(token.id);
    }
    cursor += stride;
  }

  return hidden;
}

function getHiddenPercent(tokens, hiddenTokenIds) {
  const totalWords = getWordTokens(tokens).length;
  if (!totalWords) return 0;
  return Math.round((hiddenTokenIds.length / totalWords) * 100);
}

module.exports = {
  getHiddenTokenIds,
  getHiddenPercent,
};
