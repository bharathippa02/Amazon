require('dotenv').config();

const express=require("express");

const mongoose=require("mongoose");

const request = require('request');

const ejs=require("ejs");

const https=require("https");

const app=express();

app.use(express.urlencoded({extended:true}));

app.set('view engine','ejs');

app.use(express.static("public"));

var info;

var option="Tshirts for men";

var viewed=0,count=0;

var dis="disabled",dis1="disable";


mongoose.connect("mongodb://localhost:27017/cartDB",{useUnifiedTopology:true,useNewUrlParser:true})


const cartSchema=new mongoose.Schema({
  
    id:String

})

const Cart=new mongoose.model("Cart",cartSchema);



app.get("/",function(req,res)
{
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
         // res.send(info);

         Cart.find({},function(err,foundItem)
         {
             if(err){
                 console.log(err);
             }
             else
             {
               count=foundItem.length; 
               console.log(foundItem);
             }
         })

         res.render("home",{info:info.products,disable:dis1,disabl:dis,count:count});

         // console.log(info);
          
      });
})


app.post("/",function(req,res){

    option=req.body.productSearch;
    console.log(option);
    res.redirect("/");
})



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
        res.redirect("/");
        
       
    }
     else{
           viewed=viewed-info.itemCount%48;
        res.render("home",{info:info.products,disable:"disabled",disabl:dis,count:count})
       
        
    }
    console.log(viewed);
  
});
 
app.post("/prev",function(req,res)
{
    i++;
    viewed=viewed-48;
    if(viewed>=0)
    {
        if(viewed==0)
        {
            dis="disabled";
        }
        dis1="disable"
        res.redirect("/");
    }
    else {
        viewed=0;
        res.render("home",{info:info.products,disable:"disable",disabl:"disabled",count:count})
    }
  
})

app.get("/cart",function(req,res){

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
})

app.post("/cart",function(req,res){

    const productname=req.body.productName;

    const product=new Cart({id:productname});

    product.save();

    console.log(productname);

    count+=1;
            //foundItem.push({id:productname});
          //res.render("cart",{info:info.products,foundItem:foundItem});  
          res.render("home",{info:info.products,disable:dis1,disabl:dis,count:count}); 
  
    

    
})


app.get("/delete",function(req,res){

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

})

app.post("/delete",function(req,res)
{
  count=count-1;
  const productId=req.body.productId;
  
  Cart.deleteOne({id:productId},function(err)
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




app.listen(3000,function(req,res)
{
    console.log("Server running on port 3000");
})