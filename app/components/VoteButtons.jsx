const React = require('react');

/* takes a prop 'label' and gets the other props from store via VoteContainer 
  and returns a div containing the label, vote buttons, and vote summary */
const VoteButtons = function({ label, onReferencechange, retrievedVerse, reference, verse }) {
  return (
    <div>
      
      <h2>{label}</h2>
      <input type="text" onChange={onReferencechange} />
      <button alt="go" onClick={retrievedVerse(reference)}>Go</button>
      <p>Reference: {reference} </p>
      <p>Verse: {verse}</p>
    </div>
  );
}

module.exports = VoteButtons;