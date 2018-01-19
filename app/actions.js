/* actions */

module.exports = {
  REFERENCE_CHANGE: 'REFERENCE_CHANGE',
  RETRIEVING_VERSE: 'RETRIEVING_VERSE',
  
  referenceChange: function(reference) {
    return {
      type: this.REFERENCE_CHANGE,
      reference: reference
    }
  },

  retreivingVerse: function(verse) {
    return {
      type: this.RETREIVING_VERSE,
      verse: verse
    }
  }
  
}
