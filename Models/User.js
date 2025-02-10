let mongoose=require('mongoose');
let {Schema}=mongoose;

let UserSchema=new mongoose.Schema(
    {
        name:String,
        email:{type:String,unique:true},
        password:String 
    }
);
let UserModel=mongoose.model('User',UserSchema);

module.exports=UserModel;