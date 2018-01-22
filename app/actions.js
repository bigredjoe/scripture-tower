/* actions */

const axios = require('axios');

export const REFERENCE_CHANGE = 'REFERENCE_CHANGE';
export const RETRIEVING_VERSE = 'RETRIEVING_VERSE';
export const RETRIEVED_VERSE = 'RETRIEVED_VERSE';
export const FADE_VERSE = 'FADE_VERSE';

export function referenceChange(reference){
    return {
      type: REFERENCE_CHANGE,
      reference: reference
    }
}
  
export function referenceRetrieved(verse) {
    return {
      type: RETRIEVED_VERSE,
      verse: verse
    }
}

export function retreivingVerse(reference) {
    return (dispatch) => {
      dispatch({
        type: RETRIEVING_VERSE,
        reference: reference
      });
      axios.get(`/referenceLookup?reference=${reference}`).then(function(response) {
        console.log(response);
        dispatch(referenceRetrieved(response.data));
      });
    }
  }
  
export function fadeVerse(opacity) {
    return {
      type: this.FADE_VERSE,
      opacity: opacity
    }
  }
