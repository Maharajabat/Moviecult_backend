const mongoose=require('mongoose');
const userdet=new mongoose.Schema({
    "username":{
        type:String
    },
    "email":{
        type:String
    },
    "password":{
        type:String
    }
},{versionKey:false})
const usermodel=mongoose.model("user_info",userdet);
module.exports={usermodel};