const mysql = require('mysql');
const config = require('config');
function createConnection() {
    return new Promise((resolve, reject) => {
        let dbConfig = {
            host: config.get('mysql.host'),
            user: config.get('mysql.user'),
            password: config.get('mysql.password')
        };
        const connection = mysql.createConnection(dbConfig);
        connection.connect((err) => {
            if (err) return reject(err);
            //If schema doesn't exists then create then connect
            connection.query(`CREATE DATABASE IF NOT EXISTS ${config.get('mysql.database')}`, function (err, result) {
                if (err) return reject(err);
                dbConfig["database"] = config.get('mysql.database')
                const connection = mysql.createConnection(dbConfig);
                process.connection = connection;
                return resolve(result);
            });
        });
    })
};
module.exports = {
    createConnection
};