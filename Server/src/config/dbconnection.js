const mongoose = require("mongoose")
const dotenv  = require("dotenv")
dotenv.config();

const connectdb = ()=>{
    console.log(process.env.DBURL);
    
    mongoose.connect(process.env.DBURL)
    .then(()=>{
        console.log("Connection successfull");
    })
    .catch((err)=>{
        console.log(err);
        process.exit(1);
    })

}

module.exports = connectdb;