require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const MONGO_URI = process.env.MONGODB_URI;
const MONGOATLAS_URI = process.env.MONGOATLAS_URI;
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/data", (req, res) => {
  const data = {
    message: "This is some data from the server",
    timestamp: new Date(),
  };
  res.json(data);
});
mongoose
  .connect(MONGOATLAS_URI)
  .then(() => {
    console.log("Connected to Atlas MongoDB Successfully ❤");
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });
