/* container which maps state and dispatches to its props 
  so it can be referenced in the VoteButtons component */

const { connect } = require('react-redux');
const actions = require('../actions');
const VoteButtons = require('../components/VoteButtons');

const mapStateToProps = function(state) {
  return {
    reference: state.reference,
    voteCount: state.voteCount,
    verse: state.verse
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onReferencechange: (event) => {
      dispatch(actions.referenceChange(event.target.value));
    },
    retrievedVerse: (reference) => {
      dispatch(actions.retreivingVerse(reference))
    }
  }
}

const VoteContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(VoteButtons);

module.exports = VoteContainer;