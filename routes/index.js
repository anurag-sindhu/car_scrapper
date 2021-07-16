'use strict';
var express = require('express'),
  http = require('http'),
  searchService = require('../services/search'),
  favoritesService = require('../services/check_favorites');

var app = express();

//Only 5 sockets are allowed at a time
http.globalAgent.maxSockets = 5;

app.get('/search', async function (req, res, next) {
  try {
    let data = await searchService.startSearch();
    return res.status(200).send({ message: 'Operation completed', data });
  } catch (e) {
    return res.status(e.status || 500).send({ message: e.message, stack: e.stack });
  }
});

app.get('/favorites', async function (req, res, next) {
  try {
    let data = await favoritesService.startFavoritesSearch();
    return res.status(200).send({ message: 'Operation completed', data });
  } catch (e) {
    return res.status(e.status || 500).send({ message: e.message, stack: e.stack });
  }
});

module.exports = app;
