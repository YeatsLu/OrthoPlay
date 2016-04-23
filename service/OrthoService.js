/**
 * Created by LVZY on 2016/4/11.
 */
var OrthoDao = require('../dao/OrthoDao'),
    STlService = require('./STLService'),
    ICPService = require('./ICPService');

var uuid = require('uuid'),
    mkdirp = require('mkdirp'),
    path = require('path');

var treatmentDao = new OrthoDao.TreatmentDao(),
    toothPlayDao = new OrthoDao.ToothPlayDao();

var MODELSDIR = {
    TOOTH: function (treatmentId) {
        return '/models/' + treatmentId + '/tooths/';
    },
    JAWLOWER: function (treatmenmtId) {
        return '/models/' + treatmenmtId + '/jaws/lower/';
    },
    JAWUPPER: function (treatmentId) {
        return '/models/' + treatmentId + '/jaws/upper/';
    }
};

var OrthoService = {};

OrthoService.saveTreatment = function (patient, description, tooths, cb) {
    var dirId = uuid.v1(),
        toothPath = MODELSDIR.TOOTH(dirId),
        jawLowerPath = MODELSDIR.JAWLOWER(dirId),
        jawUpperPath = MODELSDIR.JAWUPPER(dirId);

    var test = path.resolve('..' + toothPath)

    mkdirp(path.resolve(__dirname, '..' + toothPath), function (err) {
        if (err) throw err;
        mkdirp(path.resolve(__dirname, '..' + jawLowerPath), function (err) {
            if (err) throw err;
            mkdirp(path.resolve(__dirname, '..' + jawUpperPath), function (err) {
                if (err) throw err;
                var treatmentDo = new OrthoDao.TreatmentDo(
                    undefined, patient, description,
                    toothPath, jawLowerPath, jawUpperPath
                );
                //treatmentDo.pushTooth(tooths);
                treatmentDo.toothPlay = tooths;
                treatmentDao.insert(treatmentDo, cb);
            });
        });
    });
};

OrthoService.saveToothPlay = function (treatmentId, beforePath, afterPath, cb) {
    STlService.Parse(beforePath, function (err, beforeVs) {
        if (err) {
            cb(err);
        } else {
            STlService.Parse(afterPath, function (err, afterVs) {
                if (err) {
                    cb(err);
                } else {
                    var vsLength = beforeVs.length / 3;
                    var RT = ICPService.compute(beforeVs, vsLength, afterVs, vsLength,
                        Math.round(vsLength * 0.75), 0.000001, 35);

                    var toothPlay = new OrthoDao.ToothPlayDo(undefined, treatmentId, beforePath);
                    toothPlay.rotation = RT.R.toString();
                    toothPlay.translation = RT.T.toString();

                    toothPlayDao.insert(toothPlay, function (result) {
                        cb(undefined, result);
                    });
                }
            });
        }
    });
};

OrthoService.updateToothPlay = function(toothPlayList, cb) {
    toothPlayDao.update(toothPlayList, cb);
}

OrthoService.getAll = function (cb) {
    treatmentDao.selectAll(cb);
}

OrthoService.getOne = function (treatmentId, cb) {
    treatmentDao.selectById(treatmentId, cb);
}

// Test
//var before = __dirname + '/../public/model/before/Tooth_14.stl';
//var after = __dirname + '/../public/model/after/Tooth_14.stl';
//OrthoService.saveToothPlay('ii', before, after, function(err, result) {
//    if (err) throw err;
//   console.log(result);
//});

module.exports = OrthoService;