/* reducers */

const { REFERENCE_CHANGE, RETRIEVING_VERSE, FADE_VERSE } = require('./actions');

function votes(state = [], action) {
  switch (action.type) {
    case REFERENCE_CHANGE: 
      return Object.assign({}, state, {
        voteScore: ( state.voteScore ) ? state.voteScore + 1 : 1,
        voteCount: ( state.voteCount ) ? state.voteCount + 1 : 1
      });
    case RETRIEVING_VERSE:
       return Object.assign({}, state, {
        voteScore: ( state.voteScore ) ? state.voteScore - 1 : -1,
        voteCount: ( state.voteCount ) ? state.voteCount + 1 : 1
      });
    case FADE_VERSE:
    	return Object.assign({}, state, {
    		verseOpacity: action.opacity 
    	});
    default:
      return state;
  }
}

module.exports = votes