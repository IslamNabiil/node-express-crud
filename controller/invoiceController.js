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
        productName: product.name,
        quantity: item.quantity,
        price: product.sellingPrice,
      });

      product.quantity -= item.quantity;
      await product.save();
    }

    const total = subTotal - (discount || 0);

    const user = await User.findById(customer);
    if (!user) {
      return res.status(400).json({
        message: `There is no user with the id : ${customer}`,
      });
    }

    const counter = await Counter.findOneAndUpdate(
      { id: "invoiceId" }, // 1. دور على العداد بتاع الفواتير
      { $inc: { seq: 1 } }, // 2. زود الـ seq بمقدار 1 (+1)
      { returnDocument: "after", upsert: true }, // 3. هتلر البرمجة: لو مش موجود أنشئه (upsert)، ورجعلي الرقم الجديد بعد الزيادة (new)
    );

    const balance = user.balance;
    const updatedBalance = user.balance + total;

    // كدة بقا معانا رقم الفاتورة الجاهز جوة: counter.seq

    const newInv = await Invoice.create({
      invoiceNumber: counter.seq,
      customer,
      customerName: user.name,
      balanceBefore: balance,
      items: finalData,
      subTotal,
      discount,
      totalAmount: total,
      balanceAfter: updatedBalance,
    });

    user.balance = updatedBalance;
    await user.save();

    await newInv.populate([
      { path: "customer", select: "name email balance" },
      { path: "items.product", select: "name category sellingPrice" },
    ]);

    return res.status(201).json({
      message: "Everything is all right ✔",
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
    const queryObj = { ...req.query };
    const excludedFields = ["page", "limit", "sort", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    Object.keys(queryObj).forEach((key) => {
      if (
        typeof queryObj[key] === "string" &&
        key !== "customer" &&
        key !== "invoiceNumber"
      ) {
        queryObj[key] = { $regex: queryObj[key], $options: "i" };
      }
    });

    let query = Invoice.find(queryObj);

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
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
    query = query.skip(skip).limit(limit);

    const numInvoice = await Invoice.countDocuments();
    const totalPages = Math.ceil(numInvoice / limit);

    if (req.query.page) {
      if (skip >= numInvoice) {
        throw new Error("This page does not exist");
      }
    }

    const invoices = await query;

    res.status(200).json({
      message: `We've catched ${invoices.length} invoices successfully ✅`,
      pagination: {
        numInvoice,
        totalPages,
        currentPage: page,
        limit,
      },
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getInvById = async (req, res) => {
  try {
    const invId = req.params.id;
    const inv = await Invoice.findById(invId).populate([
      { path: "customer", select: "name email balance" },
      { path: "items.product", select: "name category sellingPrice" },
    ]);

    if (!inv) {
      return res.status(404).json({
        message: "Invoice not found ❌",
      });
    }

    res.status(200).json({
      message: `We've catched the inv num ${inv.invoiceNumber} successfully ✅`,
      data: inv,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.deleteInv = async (req, res) => {
  try {
    const invId = req.params.id;
    const inv = await Invoice.findById(invId);
    if (!inv) {
      return res.status(404).json({
        message: "Invoice not found ❌",
      });
    }

    const user = await User.findById(inv.customer);
    user.balance -= inv.totalAmount;
    await user.save();

    let data = [];

    const items = inv.items;
    for (let item of items) {
      const product = await Product.findById(item.product); //main storage
      if (product) {
        product.quantity += item.quantity;
        data.push(product);
        await product.save();
      }
    }

    await Invoice.findByIdAndDelete(invId);

    res.status(200).json({
      message: `We've deleted the inv num ${inv.invoiceNumber} successfully ✅`,
      data: inv,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.updateInv = async (req, res) => {
  try {
    // old invoice data
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        message: "Invoice not found ❌",
      });
    }
    const oldInv = await Invoice.findById(id);

    // new invoice data
    const { customer, discount, items } = req.body;
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "All fields must be filled ❌",
      });
    }

    let subTotal = 0;
    let finalData = [];

    for (let item of items) {
      const product = await Product.findById(item._id); //the data from db
      if (!product) {
        return res.status(404).json({
          message: `There is no item with the id : ${item._id}`,
        });
      }

      subTotal += product.sellingPrice * item.quantity;
      finalData.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.sellingPrice,
        total: product.sellingPrice * item.quantity,
      })
    }

    res.status(200).json({
      items: finalData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
