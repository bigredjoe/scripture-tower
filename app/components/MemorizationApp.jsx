const React = require('react');
const TextComposer = require('./TextComposer');
const PracticeText = require('./PracticeText');
const PracticeControls = require('./PracticeControls');
const SessionSummary = require('./SessionSummary');
const { tokenizeText } = require('../utils/textTokens');
const { getHiddenTokenIds, getHiddenPercent } = require('../utils/sessionEngine');
const { normalizeText } = require('../utils/normalize');

class MemorizationApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState();

    this.startPractice = this.startPractice.bind(this);
    this.nextRound = this.nextRound.bind(this);
    this.resetRound = this.resetRound.bind(this);
    this.revealOne = this.revealOne.bind(this);
    this.toggleMode = this.toggleMode.bind(this);
    this.updateTypedAttempt = this.updateTypedAttempt.bind(this);
    this.finishSession = this.finishSession.bind(this);
    this.restart = this.restart.bind(this);
    this.onTitleChange = this.onTitleChange.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
  }

  getInitialState() {
    return {
      phase: 'compose',
      title: '',
      text: '',
      tokens: [],
      round: 1,
      hiddenTokenIds: [],
      hintsUsed: 0,
      checkMode: 'self',
      typedAttempt: '',
      typeScore: null,
      startedAt: null,
      endedAt: null,
      peakHiddenPercent: 0,
    };
  }

  onTitleChange(event) {
    this.setState({ title: event.target.value });
  }

  onTextChange(event) {
    this.setState({ text: event.target.value });
  }

  startPractice() {
    const tokens = tokenizeText(this.state.text);
    const hiddenTokenIds = getHiddenTokenIds(tokens, 1);

    this.setState({
      phase: 'session',
      tokens,
      round: 1,
      hiddenTokenIds,
      hintsUsed: 0,
      typedAttempt: '',
      typeScore: null,
      startedAt: Date.now(),
      endedAt: null,
      peakHiddenPercent: getHiddenPercent(tokens, hiddenTokenIds),
    });
  }

  nextRound() {
    const round = this.state.round + 1;
    const hiddenTokenIds = getHiddenTokenIds(this.state.tokens, round);
    const hiddenPercent = getHiddenPercent(this.state.tokens, hiddenTokenIds);

    this.setState((prev) => ({
      round,
      hiddenTokenIds,
      typedAttempt: '',
      typeScore: null,
      peakHiddenPercent: Math.max(prev.peakHiddenPercent, hiddenPercent),
    }));
  }

  resetRound() {
    const hiddenTokenIds = getHiddenTokenIds(this.state.tokens, this.state.round);
    this.setState({ hiddenTokenIds, typedAttempt: '', typeScore: null });
  }

  revealOne() {
    if (!this.state.hiddenTokenIds.length) return;

    const next = this.state.hiddenTokenIds.slice(0);
    next.pop();
    this.setState((prev) => ({
      hiddenTokenIds: next,
      hintsUsed: prev.hintsUsed + 1,
    }));
  }

  toggleMode() {
    this.setState((prev) => ({
      checkMode: prev.checkMode === 'self' ? 'type' : 'self',
      typedAttempt: '',
      typeScore: null,
    }));
  }

  updateTypedAttempt(event) {
    const typedAttempt = event.target.value;
    const expected = normalizeText(this.state.text);
    const actual = normalizeText(typedAttempt);
    const maxLength = Math.max(expected.length, 1);
    const shared = actual.length > expected.length ? expected.length : actual.length;
    const score = Math.max(0, Math.round((shared / maxLength) * 100));

    this.setState({ typedAttempt, typeScore: score });
  }

  finishSession() {
    this.setState({ phase: 'summary', endedAt: Date.now() });
  }

  restart() {
    this.setState(this.getInitialState());
  }

  render() {
    const {
      phase,
      title,
      text,
      tokens,
      round,
      hiddenTokenIds,
      hintsUsed,
      checkMode,
      typedAttempt,
      typeScore,
      startedAt,
      endedAt,
      peakHiddenPercent,
    } = this.state;

    if (phase === 'compose') {
      return (
        <TextComposer
          title={title}
          text={text}
          onTitleChange={this.onTitleChange}
          onTextChange={this.onTextChange}
          onStart={this.startPractice}
        />
      );
    }

    if (phase === 'summary') {
      const elapsedSeconds = Math.max(1, Math.round(((endedAt || Date.now()) - startedAt) / 1000));
      return (
        <SessionSummary
          title={title}
          round={round}
          hiddenPercent={peakHiddenPercent}
          elapsedSeconds={elapsedSeconds}
          hintsUsed={hintsUsed}
          typeScore={typeScore}
          onRestart={this.restart}
        />
      );
    }

    const hiddenPercent = getHiddenPercent(tokens, hiddenTokenIds);

    return (
      <div>
        <h2>{title || 'Untitled passage'}</h2>
        <PracticeText tokens={tokens} hiddenTokenIds={hiddenTokenIds} />
        <PracticeControls
          round={round}
          hiddenPercent={hiddenPercent}
          checkMode={checkMode}
          typedAttempt={typedAttempt}
          onTypedAttemptChange={this.updateTypedAttempt}
          onModeChange={this.toggleMode}
          onRevealOne={this.revealOne}
          onResetRound={this.resetRound}
          onNextRound={this.nextRound}
          onFinish={this.finishSession}
        />
      </div>
    );
  }
}

module.exports = MemorizationApp;
