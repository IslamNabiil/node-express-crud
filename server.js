require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();
const MONGO_URI = process.env.MONGODB_URI;
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use('/api/invoices', invoiceRoutes)

app.get("/api/data", (req, res) => {
  const data = {
    message: "This is some data from the server",
    timestamp: new Date(),
  };
  res.json(data);
});
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to Atlas MongoDB Successfully ❤");
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });
