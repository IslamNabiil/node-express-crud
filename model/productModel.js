const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true }, // كود الصنف
  category: { type: String, required: true }, // نوع الصنف
  name: { type: String, required: true }, // اسم الصنف
  purchasePrice: { type: Number, required: true }, // سعر الشراء
  sellingPrice: { type: Number, required: true }, // سعر البيع
  quantity: { type: Number, default: 0 },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
