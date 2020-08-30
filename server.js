//Importing the necessary packages for use
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
var formidable = require('formidable');
const http = require('http');
//Initialising express
const app = express();

//Seeting ejs as default
app.set('view engine', 'ejs');
//Enabling body parser for gathering data
app.use(bodyParser.urlencoded({extended: true}));
//Setting public folder to load css and images
app.use(express.static(__dirname+'/public'));
//Creating Server to import files
const server = http.createServer(app);
//Connecting mongoose database
mongoose.connect('mongodb://localhost:27017/zujoDB',{useNewUrlParser:true,useUnifiedTopology: true});
// Schema Database of table
const zSchema = {
  username:String,
  amount:Number,
  year:Number,
  month:Number,
  day:Number
};
//Creating User for Database
const User = mongoose.model('ZUser',zSchema);

//Home route User will see this as homepage
app.get("/", function(req, res){
    res.render('home',{error:'',response:''});
});
//This will be called when you submit data
app.post("/",function(req,res){
    var letterNumber = /^[0-9a-zA-Z]+$/;
    var pcount = 0;
    var ncount = 0;
    var flag = 0;
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            // oldpath : temporary folder to which file is saved to
            console.log(files)
            var oldpath = files.csvfile.path;

            var newpath = __dirname + '/uploads/' + files.csvfile.name;
            // copy the file to a new location

            fs.createReadStream(oldpath)
              .pipe(csv())
              .on('data', (row) => {
                flag=1;
                console.log(row);
                const usr = row.username;
                const amt = row.amount;
                const date = row.date.toString().split('-');
                console.log(usr);
                console.log(amt);
                console.log(date);

                if(usr.match(letterNumber) && amt==parseInt(Number(amt)) && date.length!=1)
                {
                  pcount = pcount + 1;
                  const newUser = new User({
                    username:usr,
                    amount:amt,
                    year:date[2],
                    month:date[1],
                    day:date[0]
                  });
                  newUser.save();
                }
                else
                {
                  ncount = ncount + 1;
                }
              })
              .on('end', () => {
                if(flag==0){
                  res.render('home',{error:'Empty csv',response:''});
                }
                else{
                  res.render('home',{error:ncount.toString()+' records discarded',response:pcount.toString()+' records inserted'});
                }
                console.log('CSV file successfully processed');
              });
        });
    } );
//This will be called when user clicks on the view data button
app.get('/view',function(req,res){
  User.find({}, function (err, allUsers) {
    if (err) {
        console.log(err);
    } else {
        res.render("view", { users: allUsers })
    }
})
});
//This will be called when user group data by year
app.get('/gby',function(req,res){
  var agg = [
    {$group: {
      _id: "$year",
      obj: { $push: { name: "$username", amt: "$amount", year: 'n'} },
      sum:{$sum:'$amount'}
    }}
  ];

  User.aggregate(agg, function(err, logs){
    if (err) { return def.reject(err); }

    console.log(logs[5]);
    res.render('groupview',{logs:logs})
  });
});
//This will be called when user group data by username
app.get('/gbn',function(req,res){
  var agg = [
    {$group: {
      _id: "$username",
      obj: { $push: { year: "$year",month:"$month",day:"$day",amt: "$amount", name: 'n'} },
      sum:{$sum:'$amount'}
    }}
  ];

  User.aggregate(agg, function(err, logs){
    if (err) { return def.reject(err); }

    console.log(logs[0]);
    res.render('groupviewn',{logs:logs})
  });
});
// Port number to access application
app.listen(3000,function(){
  console.log('server started at port 3000!');
});
