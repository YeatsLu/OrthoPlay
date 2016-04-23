//$(function() {

//var qa = new THREE.Quaternion(1, 0, 0, 0);
//
//var qb = new THREE.Quaternion(-1, 0, 0, 0);
//
//qa.slerp(qb, 0.005);

//console.log(qa);
//console.log(qb);
//
//$('input').on('change', function(e) {
//  var filename = $(e.currentTarget).val().replace(/^.*\\/, "")
//  console.log(filename);
//});

//
//for (var i = 0; i < 5; i++) {
//  var t = i;
//  setTimeout(function() {
//      console.log(t);
//  }, 500);
//}
//
var items = [
    { name: 'Edward', value: 21 },
    { name: 'Sharpe', value: 37 },
    { name: 'And', value: 45 },
    { name: 'The', value: -12 },
    { name: 'Zeros', value: 37 }
];
items.sort(function (a, b) {
    if (a.value > b.value) {
        return 1;
    }
    if (a.value < b.value) {
        return -1;
    }
    // a must be equal to b
    return 0;
});

//console.log(items);

var regExName = /\d{1,2}/;

var i = regExName.exec('Tooth_22.stl')[0];


console.log(i);

if (i < 15) {
    console.log('fdjois')
}

console.log(regExName.exec('Tooth_22.stl'));


//var te = [1,3,5,6];
//
//te.forEach(function(v) {
//    setTimeout(function() {
//        console.log(v);
//    }, 500);
//})

//var quaternion = {
//    w: 1,
//    x: 0,
//    y: 0,
//    z: 0,
//
//    toSting: function() {
//        return this.x + '|' + this.y + '|';
//    }
//};
//
//console.log(quaternion.toSting());


//var PlayControl = (function(fps){
//    var scope = this;
//    this.fps = fps;
//    this.cycle = 1 / fps;
//    this.step = {
//        now: 0,
//        next: function() {
//            return scope.cycle * ++scope.step;
//        }
//    };
//    this.lastTime = undefined;
//    this.diff = 0;
//    this.isMove = function() {
//        if (scope.lastTime) {
//            var now = new Date();
//            scope.diff += (now - lastTime) / 1000;
//            lastTime = now;
//            if (scope.diff > scope.cycle) {
//                scope.diff -= scope.cycle;
//                return true;
//            } else {
//                return false;
//            }
//        } else {
//            scope.lastTime = new Data();
//            return true;
//        }
//    };
//    this.isStop = function() {
//        return scope.fps == step;
//    };
//    return this;
//}(120));

//console.log(PlayControl.isM)



//});
