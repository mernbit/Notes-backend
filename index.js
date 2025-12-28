const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { PORT, MONGODB_URL } = process.env;
const port = PORT || 8000;
const authRouter = require("./Routes/Auth/auth.routes");
const notesRouter = require("./Routes/Notes/notes.route");
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
// app.use(cors());
app.options("*", cors());
app.use(express.json());

const connectDB = async () => {
  await mongoose
    .connect(MONGODB_URL)
    .then((res) => {
      console.log("MongoDB connected successfully");
    })
    .catch((error) => {
      console.log(error);
    });
};
connectDB();
// Routes

app.use("/api", authRouter);
app.use("/api", notesRouter);

app.get("/", (req, res) => {
  res.send("server is online");
});

// app.listen(port, () => {
//   console.log(`Your server is online at http://localhost:${port}`);
// });

module.exports = app;
