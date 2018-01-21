/* actions */

module.exports = {
  REFERENCE_CHANGE: 'REFERENCE_CHANGE',
  RETRIEVING_VERSE: 'RETRIEVING_VERSE',
  RETRIEVED_VERSE: 'RETRIEVED_VERSE',
  FADE_VERSE: 'FADE_VERSE',
  
  referenceChange: function(reference) {
    return {
      type: this.REFERENCE_CHANGE,
      reference: reference
    }
  },
  
  referenceRetrieved: function(verse) {
    return {
      type: this.RETRIEVED_VERSE,
      verse: verse
    }
  },

  retreivingVerse: function(reference) {
    return {
      type: this.RETREIVING_VERSE,
      reference: references
    }
  },
  
  fadeVerse: function(opacity) {
    return {
      type: this.FADE_VERSE,
      opacity: opacity
    }
  }
  
}
