//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const {spawn} = require('child_process');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "lanisa agritech",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  userid: String,
  password: String
});

const buySchema = new mongoose.Schema({
  id: String,
  mobile: Number,
  item: String,
  qty: Number,
  expdate: Date,
  cost: Number,
  latitude: Number,
  longitude: Number
});

const contactSchema = new mongoose.Schema({
  userid: String,
  firstName: String,
  lastName: String,
  dob: Date,
  email: String,
  type: String,
  telephone: Number,
  mobile: Number,
  company: String,
  address: String,
  city: String,
  pincode: Number,
  state: String,
  notes: String
});

const equipmentSchema = new mongoose.Schema({
  userid: String,
  name: String,
  model: String,
  type: String,
  ownership: String,
  aquisitionDate: Date,
  cost: Number,
  notes: String
});

const transactionSchema = new mongoose.Schema({
  userid: String,
  transactionType: String,
  amount: Number,
  transactionDate: Date,
  contactName: String,
  transactionCategory: String,
  notes: String
});

const discussionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  text: String,
  votes: Number,
  responses: [{
    name: String,
    comment: String
  }],
  resolved: Boolean,
  favorite: Boolean
});

const orderSchema = new mongoose.Schema({
  userid: String,
  item: String,
  quantity: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
buySchema.plugin(findOrCreate);
contactSchema.plugin(findOrCreate);
equipmentSchema.plugin(findOrCreate);
transactionSchema.plugin(findOrCreate);
discussionSchema.plugin(findOrCreate);
orderSchema.plugin(findOrCreate);


const User = new mongoose.model("users", userSchema);
const Buy = new mongoose.model("buys", buySchema);
const Contact = new mongoose.model("contacts", contactSchema);
const Equipment = new mongoose.model("equipments", equipmentSchema);
const Transaction = new mongoose.model("transactions", transactionSchema);
const Discussion = new mongoose.model("discussions", discussionSchema);
const Order = new mongoose.model("orders", orderSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/events",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({
      googleId: profile.id,
      name: profile.displayName
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);

app.get("/auth/google/events",
  passport.authenticate('google', {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect to events.

    //////////////////////////
    console.log(req.user._id);
    res.redirect("/main");
  });

app.get("/main", function(req, res) {
  console.log(req.user._id);
  res.render("main", {
    id: req.user._id
  });
});

app.get("/buy", function(req, res) {
  var dataToSend;
  // spawn new child process to call the python script
  const python = spawn('python', ['codes/hotspot.py']);
  // collect data from script
  python.stdout.on('data', function(data) {
    console.log('Pipe data from python script ...');
    dataToSend = data.toString();
  });
  // in close event we are sure that stream from child process is closed
  python.on('close', (code) => {
    console.log(`child process close all stdio with code ${code}`);
    // send data to browser
    console.log(dataToSend);

    Buy.find({}, function(err, result) {
      console.log(result);
      res.render("buy", {
        result: result,
        data: dataToSend
      });
    });
  });
});

app.get("/rec", function(req, res) {
  var dataToSend;
  // spawn new child process to call the python script
  const pytho = spawn('python', ['codes/crop.py']);
  // collect data from script
  pytho.stdout.on('data', function(data) {
    console.log('Pipe data from python script ...');
    dataToSend = data.toString();
  });
  // in close event we are sure that stream from child process is closed
  pytho.on('close', (code) => {
    console.log(`child process close all stdio with code ${code}`);
    // send data to browser
    console.log(dataToSend);

      res.render("rec", {
        data: dataToSend
      });
  });
});

app.post("/smart", function(req, res) {
  var dataToSend;
  // spawn new child process to call the python script
  const python = spawn('python', ['codes/hotspot.py']);
  // collect data from script
  python.stdout.on('data', function(data) {
    console.log('Pipe data from python script ...');
    dataToSend = data.toString();
  });
  // in close event we are sure that stream from child process is closed
  python.on('close', (code) => {
    console.log(`child process close all stdio with code ${code}`);
    // send data to browser
    console.log(dataToSend);
    var m = 1;
    var lattitude1 = parseFloat(req.body.lat1);
    var longitude1 = parseFloat(req.body.long1);
    console.log("**********");
    console.log(lattitude1);
    console.log(longitude1);
    console.log("**********");

    Buy.find({$and:[{"latitude": {$gt : lattitude1-m, $lt : lattitude1+m}}, {"longitude": {$gt : longitude1-m, $lt : longitude1+m}}]}, function(err, result) {
      console.log("smart result");
      console.log(result);
      res.render("buy", {
        result: result,
        data: dataToSend
      });
    });
  });
});


app.get("/dash", function(req, res) {
        res.render("dash");
      });

app.post("/resourcemgmt", function(req, res) {
  console.log("resourcemgmt");
  console.log(req.body.userid);
      res.render("resource", {
        userid: req.body.userid
      });
      //res.sendFile(__dirname + "/views/resource-manager.html");
    });

app.get("/forum", function(req, res) {
  Discussion.find({}, function(err, found){
    if (err){
      console.log(err);
    } else {
      if (found) {
        res.render("discussionforum", {discussions: found});
      }
    }
  });
});

app.get("/contact", function(req, res) {
  res.render("resource", {
    userid: req.body.userid
  });
});

app.get("/equipment", function(req, res) {
  res.render("resource", {
    userid: req.body.userid
  });
});

app.get("/transaction", function(req, res) {
  res.render("resource", {
    userid: req.body.userid
  });
});

app.get("/maps", function(req, res) {
    res.render("maps");
  });

app.get("/analytics", function(req, res) {
      res.render("analytics-dashboard/index");
    });

app.post("/maps", function(req, res) {

  console.log(req.body.latitude);
  console.log(req.body.longitude);

  Buy.updateMany({id: req.body.id}, {latitude: req.body.latitude, longitude: req.body.longitude}, function(err){
    if(err) console.log(err);
    res.render("home");
  });
});

app.post("/viewmap", function(req, res) {

  console.log(req.body.latitude);
  console.log(req.body.longitude);

  Buy.findOne({
    id: req.body.sellerid
  }, function(err, result) {

    res.render("viewmap", {
      latitude: result.latitude,
      longitude: result.longitude
    });
  });
});

app.post("/search", function(req, res) {

  Buy.find({ $and: [ {"item": {$eq: req.body.item}}, {"qty": {$gte: req.body.quantity}} ] }, function(err, found){
    if (err){
      console.log(err);
    } else {
      if (found) {
        console.log(found);
        res.render("search", {result: found,
                              userid: req.body.userid,
                              item: req.body.item,
                              quantity: req.body.quantity});
      }
    }
  });
});

app.post("/order", function(req, res) {
  console.log(req.body.userid);
  console.log(req.body.item);
  console.log(req.body.quantity);

  myobj = new Order({
    userid: req.body.userid,
    item: req.body.item,
    quantity: req.body.quantity
  });

  console.log(myobj);

  Order.insertMany([myobj]).then(function() {
    console.log("Data inserted") // Success
    res.render("home");

  }).catch(function(error) {
    console.log(error) // Failure
  });
});


app.get("/sell", function(req, res) {
  res.render("sell");
});

app.post("/sell", function(req, res) {
  myobj = new Buy({
    id: req.body.id,
    mobile: req.body.mobile,
    item: req.body.item,
    qty: req.body.qty,
    expdate: req.body.expdate,
    cost: req.body.cost,
    latitude: -999,
    longitude: -999
  });

  console.log(myobj);

  Buy.insertMany([myobj]).then(function() {
    console.log("Data inserted") // Success
    res.render("sell");

  }).catch(function(error) {
    console.log(error) // Failure
  });
});

app.get("/emplogin", function(req, res) {
  res.render("emplogin");
});


app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {
  User.findOne({
    $and:[{"userid": req.body.userid}, {"password": req.body.password} ]
  }, function(err, user) {
    console.log(user);
    if(user != null )
      res.render("services", {
        userid: user.userid
      });
    else
      res.render("register");
  });
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {

  var obj = new User({
    userid: req.body.userid,
    password: req.body.password
  });

  console.log(obj);

  User.insertMany([obj]).then(function() {
    console.log("Data inserted") // Success
    res.render("home");
  }).catch(function(error) {
    console.log(error) // Failure
  });

});

app.post("/contact", function(req, res) {
  console.log("useridddddd");
  console.log(req.body.userid);
  myobj = new Contact({
    userid: req.body.userid,
    firstName: req.body.inputFirstName,
    lastName: req.body.inputLastName,
    dob: req.body.inputDOB,
    email: req.body.inputEmail,
    type: req.body.inputType,
    telephone: req.body.inputTelephone,
    mobile: req.body.inputMobile,
    company: req.body.inputCompany,
    address: req.body.inputAddress,
    city: req.body.inputCity,
    pincode: req.body.inputPostalCode,
    state: req.body.inputState,
    notes: req.body.inputNotes
  });

  console.log(myobj);

  Contact.insertMany([myobj]).then(function() {
    console.log("Data inserted") // Success
    res.render("resource", {
      userid: req.body.userid
    });

  }).catch(function(error) {
    console.log(error) // Failure
  });
});

app.post("/equipment", function(req, res) {
  myobj = new Equipment({
    userid: req.body.userid,
    name: req.body.inputName,
    model: req.body.inputModel,
    type: req.body.inputType,
    ownership: req.body.inputOwnership,
    aquisitionDate: req.body.inputAquisitionDate,
    cost: req.body.inputCost,
    notes: req.body.inputEquipmentNotes
  });

  console.log(myobj);

  Equipment.insertMany([myobj]).then(function() {
    console.log("Data inserted") // Success
    res.render("resource", {
      userid: req.body.userid
    });

  }).catch(function(error) {
    console.log(error) // Failure
  });
});

app.post("/transaction", function(req, res) {
  myobj = new Transaction({
    userid: req.body.userid,
    transactionType: req.body.inputTransactionType,
    amount: req.body.inputAmount,
    transactionDate: req.body.inputTransDate,
    contactName: req.body.inputContactName,
    transactionCategory: req.body.inputTransactionCategory,
    notes: req.body.inputTransactionNotes
  });

  console.log(myobj);

  Transaction.insertMany([myobj]).then(function() {
    console.log("Data inserted") // Success
    res.render("resource", {
      userid: req.body.userid
    });

  }).catch(function(error) {
    console.log(error) // Failure
  });
});

app.get("/viewcontacts", function(req, res){
  Contact.find({/*"secret": {$ne: null}*/}, function(err, found){
    if (err){
      console.log(err);
    } else {
      if (found) {
        res.render("contact", {contacts: found});
      }
    }
  });
});

app.get("/viewequipments", function(req, res){
  Equipment.find({/*"secret": {$ne: null}*/}, function(err, found){
    if (err){
      console.log(err);
    } else {
      if (found) {
        res.render("equipment", {equipments: found});
      }
    }
  });
});

app.get("/viewtransactions", function(req, res){
  Transaction.find({/*"secret": {$ne: null}*/}, function(err, found){
    if (err){
      console.log(err);
    } else {
      if (found) {
        res.render("transaction", {transactions: found});
      }
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
