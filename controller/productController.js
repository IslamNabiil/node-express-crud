const Product = require("../model/productModel");

exports.getAllProducts = async (req, res) => {
  try {
    const product = await Product.find();
    res.status(200).json({
      message: "U did it well ✔",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
