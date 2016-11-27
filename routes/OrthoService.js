/**
 * Created by LVZY on 2016/4/15.
 */

var fs = require('fs');

var treatment = {
    toothPlay: []
};

fs.readFile(__dirname + '/tooth_play.txt', 'utf-8', function (err, data) {
    if (err) throw err;

    var regExp = /(Tooth_\d{1,2}).*?:\s([-\s\.\d]+).*?:\s([-\s\.\d]+)/;
    var matched;

    data.split('\n').map( v => {
        if ( !v ) return;

        matched = regExp.exec( v );

        treatment.toothPlay.push({
            name: matched[ 1 ] + '.stl',
            rotation: matched[ 2 ],
            translation: matched[ 3 ]
        });
    });

    var qiniu = 'http://7xp6g5.com1.z0.glb.clouddn.com/';

    treatment.toothPath = qiniu;
    treatment.jawLowerPath = qiniu;
    treatment.jawUpperPath = qiniu;
    treatment.frameNum = 20;
});

module.exports = {
    getAll: function( cb ) {
        cb( treatment );
    }
};