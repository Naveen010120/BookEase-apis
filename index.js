let express = require('express');
let app = express();
let cors = require('cors');
//json web token
let  jwt=require('jsonwebtoken');
//multer
let multer=require('multer');
//files
let fs=require('fs')
let path=require('path')
//bcrypt
let bcrypt = require('bcrypt');
let jwtSecret='akjnil32ojkqliowilnkaods89'
//connections
const mongoose = require('mongoose');
const User = require('./Models/User.js');
let Place=require('./Models/Place.js')
let BookingModel=require('./Models/Booking.js')
let cookieParser=require('cookie-parser');
//image downloader
let imageDownloader=require('image-downloader');
//hidden the url
require('dotenv').config();

app.use(express.json());
app.use(cookieParser());
app.use('/uploads',express.static(__dirname+'/uploads'))
mongoose.connect(process.env.MONGO_URL).then(()=>console.log("database connetd")).catch((error)=>console.log({error: "database not connected",error: error}))

function getUserDataFromReq(req){
  return new Promise((resolve,reject)=>{
    jwt.verify(req.cookies.token,jwtSecret,{},async(err,userData)=>{
      if(err) throw err;
      resolve(userData)
    })
  })
 
}

app.use(cors({
    credentials: true,
    origin: 'https://book-ease-project.vercel.app/',
}))
app.get('/test', (req, res) => {
    // console.log(process.env.MONGO_URL)
    res.json('test ok');
    console.log('test ok')
})
app.post('/register', async (req, res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {name,email,password} = req.body;
  
    try {
      const userDoc = await User.create({
        name,
        email,
        password:bcrypt.hashSync(password, 10),
      });
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    }
});

app.post('/login',async(req,res)=>{
  const {email,password} = req.body;
  const userDoc = await User.findOne({email});
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      console.log('ok')
      jwt.sign({
        email:userDoc.email,
        id:userDoc._id,
    
      },jwtSecret,{},(err,token)=>{
        if(err) throw err;

        res.cookie('token',token).json(userDoc)
      })
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
})

app.get('/profile',(req,res)=>{
  let {token}=req.cookies;
  if(token){
    jwt.verify(token,jwtSecret,{},async(err,userData)=>{
      if(err) throw err;
      let {name,email,_id}=await User.findById(userData.id)
      res.json({name,email,_id});
    })
  }else{
    res.json(null);
  }
  
})

app.post('/logout',(req,res)=>{
  res.cookie('token','').json(true);
})


app.post('/upload-by-link',async(req,res)=>{
  let {link}=req.body;
  let newName='photo'+Date.now()+'.jpg';
 await imageDownloader.image({
    url:link,
    dest:__dirname +'/uploads/'+newName
  });
res.json(newName)


})
let photosMiddleware=multer({dest:'uploads/'})
app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
  let uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    let { path, originalname } = req.files[i];
    let parts = originalname.split('.');
    let ext = parts[parts.length - 1];

    // Ensure the correct new file path without duplicate 'uploads/' in it
    let newPath = `uploads/${path.split('\\').pop()}.${ext}`;

    // Rename the file
    fs.renameSync(path, newPath);

    // Push the new file name for response
    uploadedFiles.push(newPath.replace('uploads/', ''));
  }
  res.json(uploadedFiles);
});


app.post('/places',(req,res)=>{
  let {token}=req.cookies;
  let{title,address,addedPhotos,description,perks,extraInfo,checkIn,checkOut,maxGuests,price}=req.body;
  jwt.verify(token,jwtSecret,{},async(err,userData)=>{
    if(err) throw err;
   
   let placeDoc=await  Place.create({
      owner:userData.id,
      title, address, photos:addedPhotos,  description,
      perks, extraInfo, checkIn, checkOut, maxGuests,price

    });
    res.json(placeDoc)

  })
})
app.get('/user-places',(req,res)=>{
  let {token}=req.cookies;
  jwt.verify(token,jwtSecret,{},async(err,userData)=>{
    const {id}=userData;
    res.json(await Place.find({owner:id}))
  })
})
app.get('/places/:id',async(req,res)=>{
  const {id}=req.params;
  console.log(id)
res.json(await Place.findById(id));
});


app.put('/places',async(req,res)=>{

  let {token}=req.cookies;
  let{id,title,address,addedPhotos,description,perks,extraInfo,checkIn,checkOut,maxGuests,price}=req.body;
  jwt.verify(token,jwtSecret,{},async(err,userData)=>{
    if(err) throw err;
    const placeDoc=await Place.findById(id);
    if(userData.id==placeDoc.owner.toString()){
      placeDoc.set({
      title, address, photos:addedPhotos,  description,
      perks, extraInfo, checkIn, checkOut, maxGuests,price

      })
      placeDoc.save();
      res.json('ok')
    }
  })
})

app.get('/places',async(req,res)=>{
  res.json(await Place.find())
})

app.post('/bookings',async(req,res)=>{
  let userData=await getUserDataFromReq(req)
  const {place,checkIn,checkOut,numberOfGuests,name,phone,price}=req.body;
  BookingModel.create({
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
    user:userData.id,
  }).then((doc)=>{
   
    res.json(doc)
  }).catch((err)=>{
    throw err;
  })
})


app.get('/bookings',async(req,res)=>{
  let userData=await getUserDataFromReq(req);
  res.json(await BookingModel.find({user:userData.id}).populate('place'))
})
const port = 4000
app.listen(port || 4000, ()=>console.log(`https://bookease-apis.onrender.com`))