/**
 * Created by LVZY on 2016/4/10.
 */
var ICPService = require('../ICPService');

var DoubleArray = ICPService.DoubleArray;

var M = new DoubleArray(30000),
    T = new DoubleArray(30000);

var k = 0;
for (var x = -2; x < 2; x += 0.04) {

    for (var y = -2; y < 2; y += 0.04) {
        var z = 5 * x * Math.exp(-x * x - y * y);
        M[k * 3 + 0] = x;
        M[k * 3 + 1] = y;
        M[k * 3 + 2] = z;
        T[k * 3 + 0] = x - 1;
        T[k * 3 + 1] = y - 0.5;
        T[k * 3 + 2] = z + 1;
        k++;
    }
}

//var TR = new DoubleArray(9),
//    TT = new DoubleArray(3);

var RT = ICPService.compute(M, 10000, T, 10000, 1000, 0.0001, 50);

if (TR) {
    for (var i = 0; i < 9; i++) {
        console.log(TR[i] + ", ");
    }
}

if (TT) {
    for (var i = 0; i < 3;i++){
        console.log(TT[i] + ", ");
    }
}

//console.log(ICPService.test(1, 2));