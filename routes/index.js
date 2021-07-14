'use strict'
var express = require('express'),
    http = require('http'),
    config = require('config'),
    scrapDbResolver = require('../db/scrap'),
    scrapService = require("../services/scrap");

var app = express();

//Only 5 sockets are allowed at a time
http.globalAgent.maxSockets = 5;

app.get('/', async function (req, res, next) {
    try {
        let scrappedData = await scrapService.startScrap({ url: config.get(`websites.medium.url`) });
        let dbResponse = await scrapDbResolver.insertScrappedData({ data: scrappedData, con: process.connection });
        return res.status(config.get('httpStatusCode.oK') && parseInt(config.get('httpStatusCode.oK')))
            .send({ scrappedData, dbResponse });
    } catch (e) {
        return res.status(config.get('httpStatusCode.internalServerError')).send(e);
    }
});

module.exports = app;