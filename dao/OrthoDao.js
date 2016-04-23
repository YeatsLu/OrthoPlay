/**
 * Created by LVZY on 2016/4/11.
 */
var dbpool = require('./DBPool');

var fs = ('fs');

var TREATMENTSQL = {
    INSERT: 'INSERT INTO t_treatment (patient, description, tooth_path, ' +
            'jaw_lower_path, jaw_upper_path, frame_num) VALUES (?, ?, ?, ?, ?, ?)',
    SELECT_BY_ID: 'SELECT * FROM t_treatment WHERE id = ?',
    SELECT_ALL: 'SELECT * FROM t_treatment'
};

var TOOTHSQL = {
    INSERT_SOME: 'INSERT INTO t_tooth_play (treatment_id, name, rotation, translation) VALUES ?',
    INSERT_ONE: 'INSERT INTO t_tooth_play (treatment_id, name, rotation, translation) VALUES (?, ?, ?, ?)',
    SELECT_BY_FK: 'SELECT * FROM t_tooth_play WHERE treatment_id = ?',
};

var OrthoDao = {};

OrthoDao.TreatmentDo = function (id, patient, description, toothPath, jawLowerPath, jawUpperPath, frameNum) {
    this.id = id;
    this.patient = patient;
    this.description = description;
    this.toothPath = toothPath;
    this.jawLowerPath = jawLowerPath;
    this.jawUpperPath = jawUpperPath;
    this.frameNum = frameNum;

    this.toothPlay = [];
};

OrthoDao.TreatmentDo.prototype = {
    constructor: OrthoDao.TreatmentDo,

    pushTooth: function (toothPlay) {
        this.toothPlay.push(toothPlay);
    },
};

OrthoDao.ToothPlayDo = function (id, treatmentId, name, rotation, translation) {
    this.id = id;
    this.treatmentId = treatmentId;
    this.name = name;
    this.rotation = rotation;
    this.translation = translation;
};

OrthoDao.ToothPlayDo.prototype = {
    constructor: OrthoDao.ToothPlayDo,
};

OrthoDao.TreatmentDao = function () {
    this.insert = function (treatmentDo, callback) {
        dbpool.getConnection(function (err, conn) {
            if (err) throw err;
            conn.beginTransaction(function (err) {
                if (err) throw err;

                // Insert treatment
                conn.query({
                    sql: TREATMENTSQL.INSERT,
                    values: [treatmentDo.patient, treatmentDo.description, treatmentDo.toothPath,
                            treatmentDo.jawLowerPath, treatmentDo.jawUpperPath, treatmentDo.frameNum]
                }, function (err, result) {
                    if (err) return rollback(err, conn);

                    var generatedId = result.insertId;
                    treatmentDo.id = generatedId;

                    // Insert tooth
                    var toothPlay = treatmentDo.toothPlay;
                    if (toothPlay && toothPlay.length > 0) {
                        var multiToothRows = [];
                        for (var i = 0; i < toothPlay.length; i++) {
                            multiToothRows.push([
                                generatedId, toothPlay[i].name, toothPlay[i].rotation, toothPlay[i].translation
                            ]);
                            toothPlay[i].treatmentId = generatedId;
                        }
                        conn.query({
                            sql: TOOTHSQL.INSERT_SOME,
                            values: [multiToothRows]
                        }, function (err) {
                            if (err) return rollback(err, conn);

                            commit(conn);
                            callback(treatmentDo);
                        });
                    } else {
                        commit(conn);
                        callback(treatmentDo);
                    }
                });
            });
        });
    };

    this.selectAll = function (callback) {
        var retTreatmentDoList = [];
        dbpool.getConnection(function (err, conn) {
            if (err) throw err;
            conn.query({
                sql: TREATMENTSQL.SELECT_ALL
            }, function (err, rows) {
                if (err) throw err;
                if (rows && rows.length > 0) {

                    var pedding = rows.length;

                    for (var i = 0; i < rows.length; i++) {
                        var retTreatmentDo = new OrthoDao.TreatmentDo(
                            rows[i].id, rows[i].patient, rows[i].description,
                            rows[i].tooth_path, rows[i].jaw_lower_path, rows[i].jaw_upper_path,
                            rows[i].frame_num
                        );
                        retTreatmentDoList.push(retTreatmentDo);

                        (function (retTreatmentDo) {
                            conn.query({
                                sql: TOOTHSQL.SELECT_BY_FK,
                                values: [retTreatmentDo.id]
                            }, function (err, rows) {
                                if (err) throw err;
                                if (rows && rows.length > 0) {
                                    for (var i = 0; i < rows.length; i++) {
                                        retTreatmentDo.pushTooth(new OrthoDao.ToothPlayDo(
                                            rows[i].id, rows[i].treatment_id, rows[i].name,
                                            rows[i].rotation, rows[i].translation
                                        ));
                                    }
                                }

                                if (0 == --pedding) {
                                    callback(retTreatmentDoList);
                                    conn.release();
                                }
                            });

                        }(retTreatmentDo));
                    }
                }
            });
        });


    };

    this.selectById = function (id, callback) {
        dbpool.getConnection(function (err, conn) {
            if (err) throw err;
            conn.query({
                sql: TREATMENTSQL.SELECT_BY_ID,
                values: [id],
            }, function (err, rows) {
                if (err) throw err;
                if (rows && rows.length > 0) {
                    var retTreatmentDo = new OrthoDao.TreatmentDo(
                        rows[0].id, rows[0].patient, rows[0].description,
                        rows[0].toothPath, rows[0].jawLowerPath, rows[0].jawUpperPath
                    );

                    conn.query({
                        sql: TOOTHSQL.SELECT_BY_FK,
                        values: [id],
                    }, function (err, rows) {
                        if (err) throw err;
                        if (rows && rows.length > 0) {
                            for (var i = 0; i < rows.length; i++) {
                                retTreatmentDo.pushTooth(new OrthoDao.ToothPlayDo(
                                    rows[i].id, rows[i].treatment_id, rows[i].name,
                                    rows[i].rotation, rows[i].translation
                                ));
                            }
                        }

                        callback(retTreatmentDo);
                        conn.release();
                    });
                }
            });
        });
    };

    var rollback = function (err, conn) {
        return conn.rollback(function () {
            throw err;
        });
    };

    var commit = function (conn) {
        conn.commit(function (err) {
            if (err) {
                return conn.rollback(function () {
                    throw err;
                });
            }
            conn.release();
        });
    };
};

OrthoDao.ToothPlayDao = function () {
    this.insert = function (toothPlayDo, callback) {
        dbpool.getConnection(function (err, conn) {
            if (err) throw err;
            conn.query({
                sql: TOOTHSQL.INSERT_ONE,
                values: [toothPlayDo.treatmentId, toothPlayDo.name, toothPlayDo.rotation, toothPlayDo.translation]
            }, function (err) {
                if (err) throw err;
                conn.release();
                callback(toothPlayDo);
            });
        });
    };

    this.update = function(toothPlayDoList, callback) {
        var pedding  = toothPlayDoList.length;
        dbpool.getConnection(function(err, conn) {
            if (err) throw err;
            toothPlayDoList.forEach(function(v) {
                conn.query('UPDATE t_tooth_play SET comment = ? WHERE id = ?',[v.comment, v.id], function(err) {
                    if (err) throw err;
                    if (0 == --pedding) {
                        conn.release();
                        callback(true);
                    }
                });
            });
        });
    }
};

// Test

//var treatmentDo = new OrthoDao.TreatmentDo(undefined, 'P_002', 'desc');
//treatmentDo.pushTooth(new OrthoDao.ToothPlayDo(undefined, undefined, 'path', 'r', 't'));
//treatmentDo.pushTooth(new OrthoDao.ToothPlayDo(undefined, undefined, 'path', 'r', 't'));
//
//treatmentDo.pushJaw(new OrthoDao.JawPlayDo((undefined, undefined, 'J_001')));
//
//var treatmentDao = new OrthoDao.TreatmentDao();

//treatmentDao.insert(treatmentDo);

//treatmentDao.selectById(17, function(result) {
//    console.log(result);
//});

//treatmentDao.selectAll(function (result) {
//    console.log(result);
//});

//var toothDao = new OrthoDao.ToothPlayDao();
//toothDao.insert(new OrthoDao.ToothPlayDo(undefined, 17, '2_path', 'rttt', 't'));
//
//var jawDao = new OrthoDao.JawPlayDao();
//jawDao.insert(new OrthoDao.JawPlayDo(undefined, 2, '2_PATH'));

//console.log('fdsf')

module.exports = OrthoDao;