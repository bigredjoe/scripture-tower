/* reducers */

const { REFERENCE_CHANGE, RETRIEVING_VERSE, FADE_VERSE, RETRIEVED_VERSE } = require('./actions');

function verse(state = [], action) {
  switch (action.type) {
    case REFERENCE_CHANGE: 
      return Object.assign({}, state, {
        reference: action.reference
      });
    case RETRIEVED_VERSE:
      return { ...state, verse: action.verse };
    case RETRIEVING_VERSE:
       return Object.assign({}, state, {
        loadingIndicator: true
      });
    case FADE_VERSE:
    	return Object.assign({}, state, {
    		verseOpacity: action.opacity 
    	});
    default:
      return state;
  }
}

module.exports = verse