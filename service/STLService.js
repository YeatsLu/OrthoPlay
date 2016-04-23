/**
 * Created by LVZY on 2016/4/11.
 */
var fs = require('fs');

var DoubleArray = require('./ICPService').DoubleArray;

var STLService = {};

STLService.Parse = function (file, callback) {
    fs.readFile(file, function (err, data) {
        if (err) {
            callback(err);
        } else {
            var reader = new DataView(toArrayBuffer(data));
            var faces = reader.getUint32(80, true);

            var dataOffset = 84;
            var faceLength = 12 * 4 + 2;

            var offset = 0;

            //var vertices = new Float32Array(faces * 3 * 3);
            var vertices = new DoubleArray(faces * 3 * 3);

            for (var face = 0; face < faces; face++) {
                var start = dataOffset + face * faceLength;

                for (var i = 1; i <= 3; i++) {
                    var vertexstart = start + i * 12;

                    vertices[offset] = reader.getFloat32(vertexstart, true);
                    vertices[offset + 1] = reader.getFloat32(vertexstart + 4, true);
                    vertices[offset + 2] = reader.getFloat32(vertexstart + 8, true);

                    offset += 3;
                }
            }
            callback(undefined, vertices);
        }
    });

    function toArrayBuffer(buffer) {
        var ab = new ArrayBuffer(buffer.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
        return ab;
    }
};

module.exports = STLService;



