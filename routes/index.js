'use strict';
var express = require('express'),
  http = require('http'),
  searchService = require('../services/search');

var app = express();

//Only 5 sockets are allowed at a time
http.globalAgent.maxSockets = 5;

app.get('/', async function (req, res, next) {
  try {
    let data = await searchService.startSearch();
    return res.status(200).send(data);
  } catch (e) {
    return res.status(e.status || 500).send(e);
  }
});

module.exports = app;
