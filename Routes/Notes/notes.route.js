const express = require("express");
const notesRouter = express.Router();
const mongoose = require("mongoose");
const Note = require("../../models/Notes/notes.model");
const User = require("../../models/Auth/auth.model");
const verifyToken = require("../../middlewares/token/verifyToken");
notesRouter.post("/create", async (req, res) => {
  const { title, allowedUsers, access, content, createdBy } = req.body;
  const users = await User.find({ email: { $in: allowedUsers } });
  try {
    const note = await Note.create({
      title,
      content,
      createdBy,
      // createdBy: req.user._id,
      allowedUsers: users.map((u) => u._id),
      access: access || "Private",
    });
    res.status(200).json({ msg: "Note created successfully", note });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error", error });
    console.log(error);
  }
});

notesRouter.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    await Note.deleteOne({ _id: req.params.id });
    res.json({ msg: "Deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Somethig went wrong", error });
  }
});

notesRouter.get("/get", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [
        { createdBy: req.user.id },
        { allowedUsers: { $in: [req.user.id] } },
        // { allowedUsers: new mongoose.Types.ObjectId(req.user.id) },
      ],
    }).sort({ createdAt: -1 });
    // console.log(notes);
    res.json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "something went wrong" });
  }
});
notesRouter.get("/get/notes", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.user.id });
    // console.log(notes);
    res.json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "something went wrong" });
  }
});
notesRouter.get("/get/private", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({
      createdBy: req.user.id,
      access: "Private",
    });
    // console.log(notes);
    res.json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "something went wrong" });
  }
});

notesRouter.get("/get/my-notes", async (req, res) => {
  const userId = req.query.userId;
  try {
    const notes = await Note.find({ createdBy: userId });
    res.send(notes);
  } catch (error) {
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

notesRouter.get("/get/recent", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.user.id })
      .sort({
        createdAt: -1,
      })
      .limit(3);
    res.send(notes);
  } catch (error) {
    res.status(500).json({ msg: "ERROR" });
  }
});

notesRouter.get("/get/shared", async (req, res) => {
  const userId = req.query.userId;
  const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
  if (!isValidObjectId) {
    return res.status(400).json({ msg: "Invalid userId" });
  }
  try {
    const notes = await Note.find({
      // access: "Private",
      allowedUsers: {
        $in: [new mongoose.Types.ObjectId(userId)],
      },
    }).sort({ createdAt: -1 });
    console.log(notes);
    res.json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong", error });
  }
});

notesRouter.get("/get/public", async (req, res) => {
  try {
    const notes = await Note.find({ access: "Public" });
    console.log(notes);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
});

notesRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const singleNote = await Note.findById(id)
      .populate("allowedUsers", "email -_id")
      .populate("createdBy", "firstName lastName");
    if (!singleNote) return res.json({ msg: "Note not found" });
    console.log(singleNote);
    res.json(singleNote);
  } catch (error) {
    console.log(error);
    // res.status(400).json({ msg: "Internal server error", error });
  }
});

// notesRouter.get("/search", verifyToken, async (req, res) => {
//   const { query } = req.query;
//   if (!query) return console.log("No query found");
//   try {
//     const notes = await Note.find({
//       $or: [
//         { title: { $regex: query, $options: "i" } },
//         { content: { $regex: query, $options: "i" } },
//       ],
//     })
//       .sort({ createdAt: -1 })
//       .limit(20);
//     res.send(notes);
//   } catch (error) {
//     res.status(500).json({ msg: "Something went wrong", error });
//   }
// });

notesRouter.put("/:id", verifyToken, async (req, res) => {
  try {
    const { title, allowedUsers, content, access } = req.body;
    console.log(
      `title: ${title}, allowedUsers: ${allowedUsers}, content: ${content}, access: ${access}`
    );
    const users = await User.find({ email: { $in: allowedUsers } }, "_id");

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title,
        access,
        allowedUsers: users.map((u) => u._id),
        content,
      },
      { new: true }
    ).populate("allowedUsers", "email");
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" });
    console.log(error);
  }
});

module.exports = notesRouter;
