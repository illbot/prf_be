const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const expressSession = require('express-session');
const localStrategy = require('passport-local').Strategy;

//const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const cors = require('cors');

const app = express();

const whiteList = ['http://localhost:4200']

app.use(cors({
    origin: function(origin, callback){
        if(whiteList.indexOf(origin) !== -1){
            callback(null, true);
        } else {
            callback(new Error('CORS Error'));
        }
    }, credentials: true,
    methods: "GET,PUT,POST,DELETE,OPTIONS"
}))

// docker run -d --name \
//     mongo -p 127.0.0.1:27017:27017 -v $PWD/db:/data/db mongo

// debugoláshoz ajánlott: Mongo Compass program vagy a MongoDB bővítmény
// VSC-hez
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

console.log(DB_USER, DB_PASSWORD, DB_NAME)

const dbUrl = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.qxguy.mongodb.net/${DB_NAME}?retryWrites=true&w=majority` // prf-password
mongoose.connect(dbUrl)

mongoose.connection.on('connected', () => {console.log('db csatlakoztatva')})
mongoose.connection.on('error', (err) => {console.log('db csatlakozási hiba', err)})

require('./models/example.model');
require('./models/user.model');
require('./models/webshop-item.model');
//const userModel = mongoose.model('user');
// ha a nodejs-ben a mongoose-tól aru típusú dokumentumot kérek,
// azt automatikusan asszociálja majd az aruSchema-val
//mongoose.model('aru', require('./mongoose_schemes/aru.schema'))
//mongoose.model('user', require('./models/user.model'))

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())

passport.use('local', new localStrategy(function (email, password, done) {
    const userModel = mongoose.model('user')
    //a passport hacsak nem rendelkezünk másképp, a req.body.username és a req.body.password mezőket keresi majd
    userModel.findOne({ email: email }, function (err, user) {
        if (err) return done({message:'Hiba lekeres soran'}, null);
        if (!user) return done({message:'Nincs ilyen felhasználónév'}, null);
        user.comparePasswords(password, function (error, isMatch) {
            if (error) return done(error, false);
            if (!isMatch) return done('Hibas jelszo', false);
            return done(null, user);
        })
    })
}));

passport.serializeUser(function (user, done) {
    if (!user) return done({message:'nincs megadva beléptethető felhasználó'}, null);
    return done(null, user);
});
passport.deserializeUser(function (user, done) {
    if (!user) return done({message: "nincs user akit kiléptethetnénk"}, null);
    return done(null, user);
});

app.use(expressSession({secret: 'prf2022', resave: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

app.use('/_test', (req, res) => {
    res.status(200).send('OK')
})

app.use('/', require('./routes/routes'))

app.listen(3000, () => {
    console.log('A szerver fut')
})