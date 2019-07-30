"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.MONGOLAB_URI);

mongoose.connect(
  "mongodb+srv://carlo:NzEkYYnMjBuc@cluster0-7utuo.mongodb.net/test?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});

var Schema = mongoose.Schema;

var urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

var URL = mongoose.model("URL", urlSchema);

function validURL(str) {
  var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm;
  var pattern = new RegExp(expression);
  if (str.match(pattern)) {
    return true;
  } else {
    return false;
  }
}

app.post("/api/shorturl/new", function(req, res) {
  var output = new URL();
  let original_url = req.body.url;
  if (!validURL(original_url)) {
    res.json({ error: "invalid URL" });
  } else {
    URL.findOne({ original_url: original_url }, (err, data) => {
      if (err) res.send("Failed");
      if (data) {
        return res.send(data);
      } else {
        URL.find().countDocuments((err, data) => {
          let short_url = data;
          output.original_url = original_url;
          output.short_url = short_url;
          output.save((err, data) => {
            if (err) res.send("Failed");
            res.json({
              original_url: data.original_url,
              short_url: data.short_url
            });
          });
        });
      }
    });
  }
});

app.get("/checkDB", function(req, res) {
  URL.find()
    .then(item => {
      res.send(item);
    })
    .catch(err => {
      res.status(400).send("unable to find");
    });
});

app.get("/clearDB", function(req, res) {
  URL.remove((err, data) => {
    if (err) res.send("Failed");
    res.send(data);
  });
});

app.get("/api/shorturl/new/:num", function(req, res) {
  let num = req.params.num;
  URL.findOne({ short_url: num }, (err, data) => {
    if (err) res.send("Not found");
    res.redirect(data.original_url);
  });
});
