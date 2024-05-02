const mongoose=require('mongoose');
const userfav=new mongoose.Schema(
    {
        userid:{type:String},
        favmovies:{type:[Number]}
    }
,{versionKey:false})
const favmodel=mongoose.model("user_fav",userfav);
module.exports={favmodel};