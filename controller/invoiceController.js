const Product = require("../model/productModel");
const User = require("../model/userModel");
const Invoice = require("../model/invoiceModel");
const Counter = require("../model/counterModel");

exports.createInv = async (req, res) => {
  try {
    const { customer, discount, items } = req.body;
    console.log("Catched Data :", { customer, discount, items });

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "All fields must be filled ❌",
      });
    }

    let subTotal = 0;

    for (let item of items) {
      const product = await Product.findById(item._id);

      console.log(product);
      console.log(item._id);

      if (!product) {
        return res.status(404).json({
          message: `There is no item with the id : ${item._id}`,
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `the storage has less than needed - we only have ${product.quantity} from the item : ${item._id}`,
        });
      }
    }

    for (let item of items) {
      const product = await Product.findById(item._id);

      subTotal += product.sellingPrice * item.quantity;

      product.quantity -= item.quantity;
      await product.save();
    }

    console.log(`subTotal before selling the items : ${subTotal}`);

    return res.status(201).json({
      message: "Every thing is allright ✔",
      subTotal: subTotal,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
