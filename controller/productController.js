const Product = require("../model/productModel");

exports.getAllProducts = async (req, res) => {
  try {
    const queryObj = { ...req.query };

    const excludedFields = ["sort", "fields", "page", "limit"];
    excludedFields.forEach((el) => delete queryObj[el]);

    Object.keys(queryObj).forEach((key) => {
      if (typeof queryObj[key] === "string" && key !== "productCode") {
        queryObj[key] = { $regex: queryObj[key], $options: "i" };
      }
    });

    let query = Product.find(queryObj);

    if (req.query.sort) {
      query = query.sort(req.query.sort);
    } else {
      query = query.sort("_id");
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(queryObj);
    const products = await query.skip(skip).limit(limit);
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      message: `We've catched ${totalProducts} product successfully ✔`,
      pages: `Page ${page} out of ${totalPages}`,
      count: products.length,
      data: products,
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
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found ❌",
      });
    }

    res.status(200).json({
      message: `We've catched the selected product`,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { productCode, category, name, purchasePrice, sellingPrice } =
      req.body;
    if (!productCode || !category || !name || !purchasePrice || !sellingPrice) {
      return res.status(400).json({
        message: "All fields must be added ❌",
      });
    }
    const newProduct = await Product.create({
      productCode,
      category,
      name,
      purchasePrice,
      sellingPrice,
    });
    res.status(201).json({
      message: "new Product has been added successfully ✔",
      data: newProduct,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found ❌",
      });
    }

    res.status(200).json({
      message: "Product has been deleted Successfully ✅",
      data: deletedProduct,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};


