
const express = require("express")
const cors= require("cors");
const app = express();
const dotenv = require("dotenv")

dotenv.config();
console.log();

const PORT = process.env.PORT || 4000;
// console.log(PORT)
app.use(cors());
app.get('/',(req,res)=>{
    res.send("Welcome to homepage");
})

const dbconnection = require("./config/dbconnection")
dbconnection()

app.listen(PORT,()=>{
    console.log(`Server is running of ${PORT} Port`);
    
})