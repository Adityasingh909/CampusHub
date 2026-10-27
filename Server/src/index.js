const express = require("express")
const app = express();
const cors= require("cors");
const dotenv = require("dotenv");
const authrouter = require("./routes/auth.routes");
const courserouter = require("./routes/course.routes");
const enrollmentRoutes = require("./routes/enrollment.routes")
const dashboardRoutes = require("./routes/dashboard.routes");
const assignment  = require("./routes/assignment.routes");
const profileroute = require("./routes/profile.routes");
const announcementroute  = require("./routes/announcement.route");
const uploadroute = require("./routes/privateFile.route")
const privateFolderRoutes = require("./routes/privateFolder.route")
const quizRoutes = require("./routes/quiz.routes")
dotenv.config();
const PORT = process.env.PORT || 4000;


app.use(cors());
// app.use(express.json())
app.use(express.json({ limit: "5mb" }));
app.use('/api/auth',authrouter);
app.use('/api/course',courserouter)
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assignments", assignment);
app.use("/api/profile",profileroute);
app.use("/api",announcementroute);
app.use("/api/private-files",uploadroute);
app.use("/api/private-folders", privateFolderRoutes);
app.use("/api/quizzes", quizRoutes);

app.listen(PORT,(req,res)=>{
    console.log(`server is running at ${PORT}`);
    
});

