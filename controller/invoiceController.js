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
    let finalData = [];

    for (let item of items) {
      const product = await Product.findById(item._id);

      console.log("Product Info:", product);
      console.log("Item Id: ", item._id);

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

      if (item.quantity < 1) {
        return res.status(400).json({
          message: `الكميه المباعه لا يمكن ان تكون اقل من 1 قطعه مثل هذا الصنف : ${item._id}`,
        });
      }
    }

    for (let item of items) {
      const product = await Product.findById(item._id);

      subTotal += product.sellingPrice * item.quantity;

      finalData.push({
        product: product._id,
        quantity: item.quantity,
        price: product.sellingPrice,
      });

      product.quantity -= item.quantity;
      await product.save();
    }

    const total = subTotal - (discount || 0);
    const counter = await Counter.findOneAndUpdate(
      { id: "invoiceId" }, // 1. دور على العداد بتاع الفواتير
      { $inc: { seq: 1 } }, // 2. زود الـ seq بمقدار 1 (+1)
      { new: true, upsert: true }, // 3. هتلر البرمجة: لو مش موجود أنشئه (upsert)، ورجعلي الرقم الجديد بعد الزيادة (new)
    );

    // كدة بقا معانا رقم الفاتورة الجاهز جوة: counter.seq

    const newInv = await Invoice.create({
      invoiceNumber: counter.seq,
      customer,
      items: finalData,
      subTotal,
      discount,
      totalAmount: total,
    });

    await newInv.populate([
      { path: "customer", select: "name email" },
      { path: "items.product", select: "name category sellingPrice" },
    ]);

    return res.status(201).json({
      message: "Everything is all right ✔",
      //   subTotal: subTotal,
      //   discount: discount || 0,
      //   total: total, // مبروك الصافي طلع للنور 🎉
      data: newInv,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getAllInv = async (req, res) => {
  try {
    const inv = await Invoice.find()
      .populate("customer", "name email")
      .populate("items.product", "name category sellingPrice");

    if (!inv || inv.length === 0) {
      return res.status(400).json({
        message: "No invoices found ❌",
      });
    }

    res.status(200).json({
      message: `we've catched ${inv.length} inv successfully ✔`,
      data: inv,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
