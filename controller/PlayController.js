/**
 * Created by LVZY on 2016/4/12.
 */
var OrthoService = require('../service/OrthoService');

var express = require('express');
var router = express.Router();

var path = require('path');

router.get('/treatments', function (req, res) {
    OrthoService.getAll(function (result) {
        res.json(result);
    });
});

router.post('/tooth', function(req, res) {
    OrthoService.updateToothPlay(req.body.arr, function(result) {
        res.json(result);
    })
});

router.post('/upload', function (req, res) {
    // TODO
});

router.get('/test', function (req, res) {
    res.send('play-test');
});


module.exports = router;