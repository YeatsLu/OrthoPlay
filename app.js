var express = require("express"),
    bodyParser = require('body-parser');

var app = express();

var playController = require('./controller/PlayController');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/static', express.static(__dirname + "/public"));
app.use('/models', express.static(__dirname + '/models'));

app.use('/play', playController);


app.get('/', function (req, res) {
    res.render('index');
});

app.listen(3000, function () {
    console.log('server start');
});
