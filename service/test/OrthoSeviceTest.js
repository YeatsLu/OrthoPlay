/**
 * Created by LVZY on 2016/4/15.
 */
var OrthoService = require('../OrthoService'),
    OrthoDao = require('../../dao/OrthoDao');

var fs = require('fs'),
    path = require('path');

var treamtDao = new OrthoDao.TreatmentDao();

fs.readFile(__dirname + '/tooth_play.txt', 'utf-8', function (err, data) {
    if (err) throw err;

    var playArr = data.split('\r\n'),
        matched;

    var regExp = /(Tooth_\d{1,2}).*?:\s([-\s\.\d]+).*?:\s([-\s\.\d]+)/;

    var tooths = [];

    playArr.forEach(function (v, i) {
        if (v) {
            matched = regExp.exec(v);
            tooths.push(new OrthoDao.ToothPlayDo(
                undefined, undefined,
                matched[1] + '.stl',
                //matched[2].replace(/\s/g, '|'),
                //matched[3].replace(/\s/g, '|')
                matched[2],
                matched[3]
            ));
        }
    });

    OrthoService.saveTreatment('P_002', 'P__02_desc', tooths, function (result) {
        console.log(result);
    })


});
