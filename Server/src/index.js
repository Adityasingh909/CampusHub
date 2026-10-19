const express = require("express")
const cors= require("cors");
const dotenv = require("dotenv");
const router = require("./routes/auth.routes");
const app = express();

dotenv.config();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json())
app.use('/api/auth',router);

app.listen(PORT,(req,res)=>{
    console.log(`server is running at ${PORT}`);
    
});