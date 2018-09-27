'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);
const Schema = mongoose.Schema;
const urlSchema = new Schema({
    shortCode: {type: Number, unique: true, required: true},
    url: {type: String, required: true}
});
const Url = mongoose.model('URL', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/

app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


  
// your first API endpoint... 
app.get("/api/shorturl/:shortCode", async (req, res) => {
  
  let url = await Url.findOne({shortCode: parseInt(req.params.shortCode)});
  
  return res.status(301).redirect(url.url);
});

app.post("/api/shorturl/new", (req, res, next) => {  
  const handlerMethod = async (err, addresses) => {
    if(err) 
      return res.json({error: "invalid URL"});
    else {  
      let existingUrls = await Url.find();
      let url = existingUrls.find(value => value.url === req.body.url);
      if(!url){
        url = new Url({
          shortCode: existingUrls.length + 1,
          url: req.body.url
        });  
      await url.save();
      }
      return res.json({original_url: url.url, short_url: url.shortCode});
    }
  }
  let urlParts = req.body.url.split("//");  
  if(!["http:", "https:"].includes(urlParts[0]))
     return res.json({error: "Invalid URL"});
  dns.lookup(urlParts[1], handlerMethod);
});
  
         

app.listen(port, function () {
  console.log('Node.js listening ...');
});