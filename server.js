'use strict';

var bodyParser = require("body-parser");
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

console.clear();
/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGOLAB_URI);
//console.log("state: " + mongoose.connection.readyState);

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
});

var URL = mongoose.model("URL", urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ encoded:false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


// developer
app.get("/developer", function (req, res) {
  res.json({
    "developer":"Leo Vargas",
    "company":"Magno Technologies"
  });
});

// db connection
app.get("/dbconnection", function (req, res){
  mongoose.connect(process.env.MONGOLAB_URI);
  if (mongoose.connection.readyState == 2) {
    res.json({"dbConnection":"successfull"});
  }
});

/*
// Validates url string
function validateUrlRegEx(url, res){
  //var regex = /https?:\/\/(www.)?((\w|-)+.)+.\w+(\/?(\w+)?)*---remove-this-label---/g
  if (!regex.test(url)){
    console.error('Invalid URL: ' + url);
    res.json({
      "error":"invalid URL"
    });
    return false;
  }
  return true;
}

// Validates if url exists
function validateUrlDns(url, res){
    dns.resolve(url.replace(/https?:\/\/www./,""), function (error, addresses){
      if (error) {
        console.error(error);
        res.json({
          "error":"invalid URL"
        });
        return false;
      } 
      //console.log(url + " address: " + addresses);
    });
  return true; 
}

// Check if original url exists in db
function checkUrlInDataBase(url, res){
  let found = false;
  let response = res;
  URL.findOne({original_url: url}, function(err, urlFound){
    if (err) {
      console.error(err);
      return false;
    }
    if (urlFound) {
      //console.log(urlFound.original_url + " found in database: " + urlFound.short_url);
      // retrieves stored short url
      console.log(1);
      response.json({
        "original_url":urlFound.original_url,
        "short_url":urlFound.short_url
      });
      console.log(2);
      found = true;
    } else { found = false; }
  });
  console.log("status " + found);
  return found;
}

// Find the next URL based on the max url_short value  
function saveNewUrl(originalUrl, res){
  var nextURL = 0;
  URL.aggregate([
      { $group: 
         { 
          _id: null, 
          maxURL: { $max: '$short_url'}
        }
      }
    ])
      .then(function (doc, res) {
        nextURL = Number(doc[0].maxURL) + 1;

        // saves new url to database
        var url = new URL({
          short_url:nextURL,
          original_url:originalUrl
        });
        url.save(function(err, data){
          if (err) {
            console.error(err);
            return false;
          }
          res.json({
            "original_url":data.original_url,
            "short_url":data.short_url
          });
        });
      });
  return true;
}

app.post("/api/shorturl/new2", function (req, res){
  //console.log(req.body);
  console.clear();
  var originalUrl = req.body.url;
  
  if (validateUrlRegEx(originalUrl, res)){
    if (validateUrlDns(originalUrl, res)){
      //console.log(checkUrlInDataBase(originalUrl, res));
      if (!checkUrlInDataBase(originalUrl, res)){
        saveNewUrl(originalUrl, res);
      }
    }
  }  
});
*/

app.post("/api/shorturl/new", function (req, res){
  //console.log(req.body);
  console.clear();
  var originalUrl = req.body.url;
  var nextURL = 0;
  
  // Check valid url string
  //var regex = /https?:\/\/www.[a-z]+.\w+(\/?(\w+)?)*/g
  
  var regex = /https?:\/\/(www.)?((\w|-)+.)+.\w+(\/?(\w+)?)*/g
  if (!regex.test(originalUrl)){
    console.error('Invalid URL: ' + originalUrl);
    res.json({
      "error":"invalid URL"
    });
    return 0;
  } else {
    //console.log('Valid url: ' + originalUrl)

    // Check if url exists
    dns.resolve(originalUrl.replace(/https?:\/\/www./,""), function (error, addresses){
    if (error) {
      console.error(error);
      res.json({
        "error":"invalid URL"
      });
      return 0;
    }
    //console.log(originalUrl + " address: " + addresses);
    
    // Check if original url exists in db
    URL.findOne({original_url: originalUrl}, function(err, urlFound){
    if (err) {
      console.error(err);
      return 0;
    }
    if (urlFound) {
      //console.log(urlFound.original_url + " found in database: " + urlFound.short_url);
      // retrieves stored short url 
      res.json({
        "original_url":urlFound.original_url,
        "short_url":urlFound.short_url
      });
      return 0;
    } else {
      // Find the next URL based on the max url_short value  
      URL.aggregate([
        { $group: { _id: null, maxURL: { $max: '$short_url' }}}
      ])
        .then(function (doc) {
          nextURL = Number(doc[0].maxURL) + 1;
          //console.log(nextURL);
          
          // saves new url to database
          var url = new URL({
            short_url:nextURL,
            original_url:originalUrl
          });
          //console.log("url");
          //console.log(url);
          url.save(function(err, data){
            if (err) return console.error(err);
            //console.log("createAndSaveURL");
            //console.log(data);
            res.json({
              "original_url":data.original_url,
              "short_url":data.short_url
            });
          });
        });
      }
    });
  });

  }
});


app.get("/api/shorturl/:short_url", function (req, res){
  //console.log(req);
  //console.log(req.params.short_url);
  var shortUrl = req.params.short_url;
  URL.find({short_url: shortUrl}, function(err, urlFound){
    if (err) {
      console.error(err);
      return 0;
    }
    //console.log(urlFound[0].original_url);
    res.redirect(urlFound[0].original_url);
  })
    .sort({short_url: 'desc'})
    .limit(1)
    .select('-short_url');
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});