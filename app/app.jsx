const React = require('react');
const { render } = require('react-dom');

// router
const Route = require('react-router-dom').Route;
const BrowserRouter = require('react-router-dom').BrowserRouter;
const hashHistory = require('react-router-dom').hashHistory;

// redux
const { createStore, applyMiddleware } = require('redux');
const thunk = require('redux-thunk').default;  
const { Provider } = require('react-redux');
const votes = require('./reducers');
let store = createStore(votes, applyMiddleware(thunk));

/* Import Components */
const HelloWorld = require('./components/HelloWorld');
const About = require('./components/About');

render((
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <Route exact path="/" component={HelloWorld}/>
        <Route path="/about" component={About}/>
      </div>
    </BrowserRouter>
  </Provider>), document.getElementById('main'));