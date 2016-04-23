/**
 * Created by LVZY on 2016/4/10.
 */
var ffi = require('ffi'),
    ref = require('ref'),
    ArrayType = require('ref-array');

var DoubleArray = ArrayType(ref.types.double);

var ICPService = ffi.Library(__dirname + '/lib/ICP_DLL.dll', {
    'icp_compute': ['void', [DoubleArray, DoubleArray, DoubleArray, 'int', DoubleArray, 'int', 'int', 'double', 'int']],
    'getTest': ['int', ['int', 'int']]
});

var matrixToQuaternion = function(flatMatrix) {
    var quaternion = {
        w: 1,
        x: 0,
        y: 0,
        z: 0,

        toSting: function() {
            this.w + '|' + this.x + '|' + this.y + '|' + this.z;
        }
    };
    var te = new Float32Array(flatMatrix);

    //var te = flatMatrix;

    var m11 = te[ 0 ], m12 = te[ 1 ], m13 = te[ 2 ],
        m21 = te[ 3 ], m22 = te[ 4 ], m23 = te[ 5 ],
        m31 = te[ 6 ], m32 = te[ 7 ], m33 = te[ 8 ],

        trace = m11 + m22 + m33,
        s;

    if ( trace > 0 ) {
        s = 0.5 / Math.sqrt( trace + 1.0 );
        quaternion.w = 0.25 / s;
        quaternion.x = ( m32 - m23 ) * s;
        quaternion.y = ( m13 - m31 ) * s;
        quaternion.z = ( m21 - m12 ) * s;
    } else if ( m11 > m22 && m11 > m33 ) {
        s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );
        quaternion.w = ( m32 - m23 ) / s;
        quaternion.x = 0.25 * s;
        quaternion.y = ( m12 + m21 ) / s;
        quaternion.z = ( m13 + m31 ) / s;
    } else if ( m22 > m33 ) {
        s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );
        quaternion.w = ( m13 - m31 ) / s;
        quaternion.x = ( m12 + m21 ) / s;
        quaternion.y = 0.25 * s;
        quaternion.z = ( m23 + m32 ) / s;
    } else {
        s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );
        quaternion.w = ( m21 - m12 ) / s;
        quaternion.x = ( m13 + m31 ) / s;
        quaternion.y = ( m23 + m32 ) / s;
        quaternion.z = 0.25 * s;
    }

    return quaternion;
}


module.exports = {
    DoubleArray: DoubleArray,

    test: ICPService.getTest,

    compute: function(source, sLength, target, tLength, ctrlNum, thre, iter) {

        var TR = new DoubleArray(9),
            TT = new DoubleArray(3);

        ICPService.icp_compute(TR, TT, source, sLength, target, tLength, ctrlNum, thre, iter);

        var T = new Float32Array(TT);

        //var T = TT;

        return {
            R: matrixToQuaternion(TR),
            T: {
                x: T[0],
                y: T[1],
                z: T[2],

                toString: function() {
                    this.x + '|' + this.y + '|' + this.z;
                }
            }
        }
    }
};