require('dotenv').config();

const express=require("express");

const mongoose=require("mongoose");

const request = require('request');

const ejs=require("ejs");

const https=require("https");

const session = require("express-session");

const passport = require("passport");

const passportLocalMongoose = require("passport-local-mongoose");

var GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require("mongoose-findorcreate");


const app=express();

app.use(express.urlencoded({extended:true}));

app.set('view engine','ejs');

app.use(express.static("public"));

var info;

const pro=new Set();

var option="Tshirts for men";

var viewed=0,count=0;

var dis="disabled",dis1="disable";

//mongodb+srv://"+ process.env.NAME +":"+ process.env.PASSWORD+"@cluster0.lvknf.mongodb.net/cartDB


/*mongoose.connect("mongodb://localhost:27017/CartsDB",{useUnifiedTopology:true,useNewUrlParser:true})


const cartSchema=new mongoose.Schema({
  
    id:String

})

const Cart=new mongoose.model("Cart",cartSchema);*/

app.use(session({ secret: 'keyboard cat',resave:false,saveUninitialized:false}));

app.use(passport.initialize());

app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/UsersDB", {useNewUrlParser:true, useUnifiedTopology:true});

mongoose.set("useCreateIndex",true);

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    cart:Array
});

userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

const User=new mongoose.model("User",userSchema);


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
    callbackURL: "http://localhost:3000/auth/google/amazon",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));




app.get("/home",function(req,res)
{

  // const options = {
  //   method: 'GET',
  //   url: 'https://asos2.p.rapidapi.com/products/v3/detail',
  //   qs: {id: '23446487', lang: 'en-US', store: 'US', sizeSchema: 'US', currency: 'USD'},
  //   headers: {
  //     'x-rapidapi-key': '122d8814bfmsh0bd01732c39188cp1711dbjsnb7befc9574cb',
  //     'x-rapidapi-host': 'asos2.p.rapidapi.com',
  //     useQueryString: true
  //   }
  // };
  
  // request(options, function (error, response, body) {
  //   if (error) throw new Error(error);
  
  //   res.send(body);
  // });

    var options = {
        method: 'GET',
        url: 'https://asos2.p.rapidapi.com/products/v2/list',
        qs: {
          store: 'US',
          offset: viewed,
          categoryId: '4209',
          limit: '48',
          country: 'US',
          sort: 'freshness',
          q:option,
          currency: 'USD',
          sizeSchema: 'US',
          lang: 'en-US'
        },
        headers: {
            'x-rapidapi-key': process.env.API_KEY,
            'x-rapidapi-host': 'asos2.p.rapidapi.com',
          useQueryString: true
        }
      };
      
      request(options, function (error, response, body) {
          if (error) throw new Error(error);
      
           info = JSON.parse(body);

         for(var i=0;i<info.products.length;i++)
         {
           pro.add(info.products[i]);
         }

           console.log(pro.length);
         // res.send(info);

        /* Cart.find({},function(err,foundItem)
         {
             if(err){
                 console.log(err);
             }
             else
             {
               count=foundItem.length; 
               console.log(foundItem);
             }
         })    */

         console.log(req.user);

        // res.send(pro);

         User.findById(req.user._id,function(err,foundUser)
         {
           if(err)
           {
             console.log(err);
           }
           else
           {
             if(foundUser)
             {
               count=foundUser.cart.length;
              res.render("home",{info:info.products,disable:dis1,disabl:dis,count:count});
             }
           }
         })

        

         // console.log(info);
          
      }); 
});



app.post("/home",function(req,res){

    option=req.body.productSearch;
    console.log(option);
    res.redirect("/home");
})



//Login options

app.get("/",function(req,res)
{
  res.render("register");
})

app.get("/login",function(req,res)
{
   res.render("login"); 
});


app.post("/login",function(req,res)
{
  
    const user=new User({
        username:req.body.username,
        password:req.body.password
    })

    req.login(user,function(err)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/home");
            })
        }
    })

})


app.get("/register",function(req,res)
{
    res.render("register");
});

app.post("/register",function(req,res)
{
 
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");

        }
        else{
           passport.authenticate("local")(req,res,function(){
               res.redirect("/home");
           })
        }
    })
 
});







app.post("/product",function(req,res)
{
    viewed=0;

    const productname=req.body.productName;

   // console.log(productname);

    info.products.forEach(element => {
        
        if(element.id==productname)
        {
            console.log(element.id);
            res.render("product",{info:info.products,productName:productname });
        }
    });
});

app.post("/next",function(req,res)
{
    
    viewed=viewed+48;
    if(viewed<=info.itemCount)
    {
        if(viewed+48>=info.itemCount)
        {
            dis1="disabled";
        }
        dis="disable";
        res.redirect("/home");
        
       
    }
     else{
           viewed=viewed-info.itemCount%48;
        res.render("home",{info:info.products,disable:"disabled",disabl:dis,count:count})
       
        
    }
   // console.log(viewed);
  
});
 
app.post("/prev",function(req,res)
{
    
    viewed=viewed-48;
    if(viewed>=0)
    {
        if(viewed==0)
        {
            dis="disabled";
        }
        dis1="disable"
        res.redirect("/home");
    }
    else {
        viewed=0;
        res.render("home",{info:info.products,disable:"disable",disabl:"disabled",count:count})
    }
  
})

app.get("/cart",function(req,res){

  /*Cart.find({},function(err,foundItem)
  {
      if(err){
          console.log(err);
      }
      else
      {
        res.render("cart",{info:info.products,foundItem:foundItem});   
      }
  })*/

  User.findById(req.user._id,function(err,foundUser)
  {
      if(err){
          console.log(err);
      }
      else
      {
          if(foundUser)
          {
           res.render("cart",{info:[...pro],foundItem:foundUser.cart}); 
          }
      }
  })

})

app.post("/cart",function(req,res){

    const productname=req.body.productName;

    console.log(req.user);
    console.log(productname);

            //foundItem.push({id:productname});
          //res.render("cart",{info:info.products,foundItem:foundItem});  
         // res.render("home",{info:info.products,disable:dis1,disabl:dis,count:count}); 

         User.findById(req.user._id,function(err,foundUser)
         {
             if(err)
             {
                 console.log(err);
             }
             else
             {
                 if(foundUser)
                 {
                     User.findOneAndUpdate({ _id :req.user._id},{ $addToSet: {cart : productname} },function(err,foundList)
                     {
                         if(!err)
                         res.redirect("/home");
                     });

                   

                       //  res.render("home",{info:info.products,disable:dis1,disabl:dis,count:foundUser.cart.length});
    
                     
                 }
             }
         })
  
    

    
})


app.get("/delete",function(req,res){

  /*Cart.find({},function(err,foundItem)
      {
          if(err){
              console.log(err);
          }
          else
          {
            res.render("cart",{info:info.products,foundItem:foundItem});   
          }
      })*/
      res.redirect("/cart")

})

app.post("/delete",function(req,res)
{
  
  const productId=req.body.productId;
  
 /* Cart.deleteOne({id:productId},function(err)
  {
    if(err)
    console.log(err);
    else{
      Cart.find({},function(err,foundItem)
      {
          if(err){
              console.log(err);
          }
          else
          {
            res.render("cart",{info:info.products,foundItem:foundItem});   
          }
      })
    }
  })*/

  User.findById(req.user._id,function(err,foundUser)
  {
      if(err){
          console.log(err);
      }
      else
      {
          if(foundUser)
          {
              User.findOneAndUpdate( 
                  { _id :req.user._id},{ $pull: {cart : productId} },function(request,response){
                      res.redirect("/cart");})

              
          }
      }
  })
})


app.post("/pay",function(request,response){

  if(request.body.amount*100==0)
  {
    response.send("choose any products");
  }
  else{
    const params = JSON.stringify({
        "email": "customer@gmail.com",
        "amount":Math.floor(request.body.amount*100),
    
      })
      console.log(request.body.amount*100);
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
          Authorization: process.env.SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
      const req = https.request(options, res => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        });
        res.on('end', () => {
         var info=(JSON.parse(data))
         console.log(info);
          response.redirect(info.data.authorization_url);
        })
      }).on('error', error => {
        console.error(error)
      })
      
      req.write(params)
      req.end()
    }
    
    })


    app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/amazon', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
  // Successful authentication, redirect home.
  res.redirect("/home")
});





app.listen(process.env.PORT||3000,function(req,res)
{
    console.log("Server running on port 3000");
})

