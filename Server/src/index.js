const express = require("express")
const app = express();
const cors= require("cors");
const dotenv = require("dotenv");
const authrouter = require("./routes/auth.routes");
const courserouter = require("./routes/course.routes");
const enrollmentRoutes = require("./routes/enrollment.routes")
const dashboardRoutes = require("./routes/dashboard.routes");
dotenv.config();
const PORT = process.env.PORT || 4000;


app.use(cors());
app.use(express.json())
app.use('/api/auth',authrouter);
app.use('/api/course',courserouter)
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT,(req,res)=>{
    console.log(`server is running at ${PORT}`);
    
});