const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
require("dotenv").config()

const app = express()
app.use(express.json())
app.use(cookieParser())
// Allow both web client and mobile app
app.use(cors({
    origin: true, // Allow all origins (for development with mobile app)
    credentials: true
}))


app.use("/api/auth", require("./route/authRoute"))
app.use("/api/user", require("./route/userRoute"))
app.use("/api/expense", require("./route/expenceRoute"))
app.use("/api/group", require("./route/groupRoute"))
app.use("/api/settlement", require("./route/settlement"))

app.use((req, res) => {
    res.status(404).json({ message: "not found url" })
})
app.use((err, req, res, next) => {
    console.log(err)
    res.status(500).json({ message: "server error" })
})

mongoose.connect(process.env.MONGO_URL)
mongoose.connection.once("open", () => {
    console.log("db connected")
    app.listen(process.env.PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${process.env.PORT}`)
        console.log(`Access from network: http://192.168.1.26:${process.env.PORT}`)
    })
})