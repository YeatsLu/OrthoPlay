/**
 * Created by LVZY on 2016/4/11.
 */
var mysql = require('mysql');

var Pool = mysql.createPool({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'orthoplay'
});

Pool.on('connection', function(conn) {
    console.log('get connection');
})

module.exports = Pool;