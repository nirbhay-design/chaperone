//jshint esversion:6
require("dotenv").config();
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
// const encrpt=require("mongoose-encryption");
// const md5=require("md5");
// const bcrypt=require("bcrypt");
// const saltRounds=10;
const session =require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate =require("mongoose-findorcreate");



const app=express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:"MayankIs Legend.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/user3DB",{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
post ={
    Text:"",
    Comments:[]
}
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:[post]
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const secret=process.env.SECRET;
// userSchema.plugin(encrpt,{secret:secret,encryptedFields:["password"]});
const User =new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope:
  	[ 'email', 'profile' ] }
));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});
app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if(err)console.log(err);
        else{
            if(foundUsers){
                res.render("secrets",{userswithSecrets:foundUsers});
                console.log(foundUsers)
            }
        }
    })
});
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});
app.post("/submit",function(req,res){
    const submitted_secret =req.body.secret;
    const comment=""
    const obj={Text:submitted_secret,comments:comment}
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret.push(obj);
                foundUser.save(function(){
                    res.redirect("/secrets");

                });
            }
        }
    })


});
app.post("/comment",function(req,res){
    user_id=req.body.id
    cmt=req.body.comment
    ind=req.body.index
    console.log(cmt)
    User.findById(user_id,function(err,foundUser){
        if(err){
            console.log("not found");
        }
        else{
            if(foundUser){
                console.log(foundUser);
                foundUser.secret[ind]['Comments'].push(cmt)
                foundUser.save(function(){
                    res.redirect("/secrets");

                });
            }
        }
    })
  
  

});

app.get("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
});
app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
    
   
});
app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
    req.logIn(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
   
     
});







app.listen(3000,function(){
    console.log("server started at 3000");
});
