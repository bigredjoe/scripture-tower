// server.js

// init project
var express = require('express');
var app = express();
var https = require('https');
var axios = require("axios");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + '/app/index.html');
});

app.get("/referenceLookup", function(request, response) {
  let reference = request.query.reference.replace(new RegExp(" ", 'g'), "+");
  
  axios.get(`https://api.esv.org/v3/passage/html/?q=${reference}&include-passage-references=false&include-footnotes=false&include-footnote-body=false&include-subheadings=false&include-surrounding-chapters-below=false`,
           {headers: {"Authorization": `Token ${process.env.ESV_API}`}})
          .then(function(axiosResponse) { 
            response.send(axiosResponse.data);
          });

});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
