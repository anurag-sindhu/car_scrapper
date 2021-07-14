const express = require('express'),
    app = express(),
    config = require("config"),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    fileUpload = require('express-fileupload'),
    indexRouter = require("./routes/index"),
    { handleError } = require('./helpers/error');

//Db Calls and other formalities
const tables = require('./db/tables');

app.use(fileUpload());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', indexRouter);
app.use((err, req, res, next) => {
    handleError(err, res);
});

var server = app.listen(config.get('port'), () => console.log(`Example app listening at http://localhost:${config.get('port')}`));
module.exports = server