require("dotenv").config();
const mongoose = require("mongoose");
const Invoice = require("./model/invoiceModel");
const User = require("./model/userModel");
const Product = require("./model/productModel");
const Counter = require("./model/counterModel");

const MONGODB = process.env.MONGODB_URI;
const MONGOATLAS_URI = process.env.MONGOATLAS_URI;

const InvSeed = async (count = 5) => {
  try {
    await mongoose.connect(MONGOATLAS_URI);
    console.log("DB has connected successfully ✔");

    await Invoice.deleteMany({});
    console.log("Old data has been deleted successfully ✔");

    const user = await User.find();
    const product = await Product.find();

    if (user.length === 0 || product.length === 0) {
      console.log(
        "Make sure that you have users and products in your DB first",
      );
      mongoose.connection.close();
      return;
    }

    for (let i = 0; i < count; i++) {
      const randomUser = user[Math.floor(Math.random() * user.length)];
      // console.log(randomUser);

      const itemsCount = Math.floor(Math.random() * 5) + 1;
      // console.log(`ItemsCount : ${itemsCount}`);

      let chosenProduct = new Set();
      while (chosenProduct.size < itemsCount) {
        const randomProduct =
          product[Math.floor(Math.random() * product.length)];
        chosenProduct.add(randomProduct);
      }
      // console.log(`ChosenProducts : ${[...chosenProduct]}`);

      // -------------------------------------------------------------------------
      let finalData = [];
      let subTotal = 0;

      for (let prod of chosenProduct) {
        const quantity = Math.floor(Math.random() * 10) + 1;

        subTotal += prod.sellingPrice * quantity;

        // جوة الـ for (let prod of chosenProducts)
        prod.quantity -= quantity; // بنقص الكمية اللي اتباعت وهمي
        await prod.save(); // بنسيف الكمية الجديدة في جدول الـ Products

        finalData.push({
          product: prod._id,
          productName: prod.name,
          quantity: quantity,
          price: prod.sellingPrice,
        });
      }

      const discount = Math.floor(Math.random() * 100) || 0;
      const total = subTotal - discount < 0 ? 0 : subTotal - discount;

      // console.log("--- E-Inv ---");
      // console.log("Customer ID:", randomUser._id);
      // console.log("Items Data:", finalData);
      // console.log("SubTotal:", subTotal);
      // console.log("Discount:", discount);
      // console.log("Total Amount (Net):", total);
      // -------------------------------------------------------------

      const counter = await Counter.findOneAndUpdate(
        { id: "invoiceId" },
        { $inc: { seq: 1 } },
        { returnDocument: "after", upsert: true }, // تظبيطة المونجوس الجديدة تريح البال 😎
      );

      const balance = randomUser.balance;
      const updatedBalance = randomUser.balance + total;
      randomUser.balance = updatedBalance;
      await randomUser.save();

      await Invoice.create({
        invoiceNumber: counter.seq,
        customer: randomUser._id,
        customerName: randomUser.name,
        balanceBefore: balance, // لقطة الرصيد اللحظي
        items: finalData,
        subTotal,
        discount,
        totalAmount: total,
        balanceAfter: updatedBalance, // لقطة الرصيد اللحظي
      });
    }
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding data:", error);
    mongoose.connection.close();
  }
};

InvSeed(156);
