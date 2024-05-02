const express=require('express');
const app=express();
const bodyparser=require('body-parser');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const cors=require('cors');
require('dotenv').config()
app.use(cors())
app.use(bodyparser.json())
const connectDB=()=>{
    try{
        mongoose.connect(process.env.MONGOURI);
        console.log("DB Conected")
    }
    catch(error){
        console.log(error)
        console.log("DB not connected")
    }  
}
connectDB();
const port=process.env.PORT||2000;
const authentication=(req,res,next)=>{
    try{
    const authorization=req.headers.authorization;
    const token=authorization.split(" ")[1];
    return jwt.verify(token,secretkey,(error,success)=>{
        if(error){
            res.status(403).json({
                "status":"failure",
                "message":"Unauthorized access"
            })
        }
        else{next()};
    })
}
catch{
    res.status(500).json({
        "status":"failure",
        "message":"Token needed"
    })
}
}
const {favmodel}=require('./models/Userfav');
app.post('/addfav/:userid/:movieid',authentication,async(req,res)=>{
    try{
        const {userid,movieid}=req.params
       const userfav= await favmodel.find({"userid":userid});
       if(userfav.length===0){
        await favmodel.create({
            "userid":userid,
            "favmovies":[movieid]
        })
       }
       else{
         const favmovies=userfav[0].favmovies;
         favmovies.unshift(movieid);
        await favmodel.updateOne({"userid":userid},{
            "favmovies":favmovies
         })
       }
       res.status(200).json({
        "status":"Staus",
        "message":"Movie added to fav"
       })
    }
    catch(error){
        res.status(500).json({
            "status":"Failure",
            "message":"Unable to add fav"
        })
    }
});
app.get('/fav/:userid',authentication,async(req,res)=>{
   try{
    const {userid}=req.params
    const favmovies=await favmodel.find({"userid":userid})
    if(favmovies.length==0){
        res.status(200).json({
            "status":"success",
            "fav":[]
        })
    }
    else{
        res.status(200).json({
            "status":"success",
            "fav":favmovies[0].favmovies
        })
    }
   
   }
   catch(error){
    console.log(error)
    res.status(500).json({
        "status":"failure",
        "message":"cant access your data"
    })
   }
});
app.delete('/delfav/:userid/:movieid',authentication,async(req,res)=>{
    try{
        const {userid,movieid}=req.params
      await favmodel.updateOne({"userid":userid},{
       $pull:{"favmovies":movieid}
      })
      res.status(200).json({
        "status":"success",
        "message":"fav movie deleted"
      })
    }
    catch{
        res.status(500).json({
            "status":"failure",
            "message":"cant access your data to delete"
        })
    }
})
const secretkey=process.env.SECRETKEY;
const generatetoken=(userdetails)=>{
    return jwt.sign(userdetails,secretkey)
}
const {usermodel}=require('./models/User')
app.post('/adduser',async(req,res)=>{
    try{
    const {username,email,password}=req.body;
    const user=await usermodel.find({"email":email})
    if(user.length===0){
       const user= await usermodel.create({
            "username":username,
            "email":email,
            "password":password
        })
        const userobj={
            username:user.username,
            email:user.email,
            userid:user._id.toString()
        }
        const token=generatetoken(userobj)
        res.status(200).json({
            "status":"Success",
            "message":"user created",
            "token":token
        })
    }
    else{
        res.status(409).json({
            "status":"Failure",
            "message":"user already exists"
        })
    }
}
catch(error){
    console.log(error)
    res.status(500).json({
        "status":"failure",
        "message":"cant create user",
    })
}
})
app.post('/validate',async(req,res)=>{
    try{
    const {email,password}=req.body;
    const found=await usermodel.find({email:email,password:password})
    if(found.length===1){
        const userobj={
            username:found[0].username,
            email:found[0].email,
            userid:found[0]._id.toString()
        }
        const token=generatetoken(userobj);
        res.status(200).json({
            "status":"success",
            "user":found[0],
            "token":token
        })
    }
    else{
        res.status(404).json({
            "status":"failure",
            "message":"user not found"
        })
    }
}
catch{
    res.status(500).json({
        "status":"failure",
        "message":"cant validate user"
    })
}
})
app.get('/getuser/:userid',async(req,res)=>{
    try{
        const user=await usermodel.find({"_id":req.params.userid});
        if(user.length===1){
            res.status(200).json({
               "user":user 
            })
        }
        else{
            res.status(404).json({
                "status":"failure"
            })
        }
    }
    catch{
        res.status(500).json({
            "status":"failure",
            "message":"cant access user details"
        })
    }
})
app.patch('/updateuser/:userid',authentication,async(req,res)=>{
    try{
        const {userid}=req.params
        const data=await usermodel.find({"_id":userid});
        const {username,email,password}=req.body;
        if(data.length>0 && data[0].email!=email){
            const user=await usermodel.find({"email":email});
            if(user.length!=0){
                res.status(409).json({
                    "status":"failure",
                    "message":"exists"
                })
                return;
            }
        }
        const update=(await usermodel.updateOne({"_id":userid},{
            "username":username,
            "email":email,
            "password":password
        })).modifiedCount
        if(update===1){
            res.status(200).json({
                "status":"Success",
                "message":"updated"
            })
        }
        else{
            res.status(404).json({
                "status":"failure",
                "message":"user not found"
            })
        }
    

    }
    catch(error){
        res.status(500).json({
            "status":"failure",
            "message":"cannot access user profile"
        })
    }
})

app.listen(port,()=>console.log(`Listening port on ${port}`));