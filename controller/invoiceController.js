const Product = require("../model/productModel");
const Invoice = require("../model/invoiceModel");
const Counter = require("../model/counterModel");

exports.createInvoice = async (req, res) => {
  try {
    const { discount, customer, items } = req.body;
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        message: "All fields are required ❌",
      });
    }

    let subTotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${item.product} not found ❌`,
        });
      }
      if (item.quantity > product.quantity) {
        return res.status(400).json({
          message: `we don't have enough ${product.name} in stock, we only have ${product.quantity} ${product.name} in stock ❌`,
        });
      }

      const itemPrice = product.sellingPrice;
      subTotal += itemPrice * item.quantity;

      invoiceItems.push({
        product: product._id,
        quantity: item.quantity,
        price: itemPrice,
      });

      product.quantity -= item.quantity;
      await product.save();
    }
    // const invoiceNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    const counter = await Counter.findOneAndUpdate(
      { id: "invoiceSerial" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }, // ✅ المونجوز هتحب السطر ده جداً والتحذير هيختفي فوراً
    );

    const invoiceNumber = `INV-${counter.seq.toString().padStart(5, "0")}`;
    const discountAmount = discount || 0;
    const totalAmount = subTotal - discountAmount;

    const newInvoice = await Invoice.create({
      invoiceNumber,
      discount,
      customer,
      items: invoiceItems,
      subTotal,
      totalAmount,
    });

    res.status(201).json({
      message: `Invoice numbre ${invoiceNumber} has been added successfully ✔`,
      data: newInvoice,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("customer", "name email")
      .populate("items.product", "name");
    res.status(200).json({
      message: "All invoices has been catched successfully ✔",
      data: invoices,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const selectedInvoice = await Invoice.findById(invoiceId)
      .populate("customer", "name email")
      .populate("items.product", "name productCode sellingPrice");
    if (!selectedInvoice) {
      return res.status(404).json({
        message: `We didn't find an invoice with the id ${invoiceId}`,
      });
    }

    res.status(200).json({
      message: `We've catched the invoice that has the id of ${invoiceId}`,
      data: selectedInvoice,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    console.log("--------------------------------------------------");
    console.log(`🚀 جاري بدء عملية الحذف للفاتورة ذات الـ ID: ${invoiceId}`);

    // 1️⃣ جلب الفاتورة مشحونة بالأسماء فوراً (البديل المريح)
    const selectedInvoice = await Invoice.findById(invoiceId)
      .populate("customer", "name email")
      .populate("items.product", "name productCode sellingPrice");

    if (!selectedInvoice) {
      console.log("⚠️ لم يتم العثور على الفاتورة في قاعدة البيانات!");
      return res.status(404).json({
        message: `We didn't find an invoice with the id ${invoiceId}`,
      });
    }

    console.log(
      `👀 الفاتورة ممسوكة في الذاكرة حالياً ورقمها: ${selectedInvoice.invoiceNumber}`,
    );
    console.log(
      `👤 اسم العميل المترجم جوه السيرفر حالا: ${selectedInvoice.customer.name}`,
    );

    // 2️⃣ اللوب لإرجاع البضاعة للمخزن
    console.log("📦 جاري جرد وإعادة المنتجات إلى المخزن...");
    for (const item of selectedInvoice.items) {
      // 🔥 كشاف الـ Console: بنشوف الصنف اللي عليه الدور باصص لإيه
      console.log(
        `   🔸 الصنف الحالي المترجم اسمُه: "${item.product.name}"، والـ ID بتاعه هو: ${item.product._id}`,
      );

      const product = await Product.findById(item.product._id); // سحبنا الصنف بـ ID الصافي المترجم

      if (product) {
        console.log(
          `      الكمية قبل الرد في المخزن: [${product.quantity}] | كمية الفاتورة المراد ردها: [${item.quantity}]`,
        );

        product.quantity += item.quantity; // رد البضاعة
        await product.save();

        console.log(
          `      ✅ تم الرد! الكمية الجديدة الحالية في المخزن أصبحت: [${product.quantity}]`,
        );
      }
    }

    // 3️⃣ الحذف الفعلي بعد ما أخذنا نسختنا المترجمة وجردنا المخزن
    await Invoice.findByIdAndDelete(invoiceId);
    console.log(
      "🗑️ تم حذف الفاتورة نهائياً من قاعدة البيانات (MongoDB) بنجاح!",
    );

    // 4️⃣ الرد النهائي بالداتا المترجمة الجاهزة في الذاكرة
    console.log(
      "✨ جاري إرسال الرد النهائي الشيك إلى الـ Postman ببيانات الفاتورة الممسوحة...",
    );
    res.status(200).json({
      message: `Invoice number ${selectedInvoice.invoiceNumber} has been deleted Successfully ✔`,
      data: selectedInvoice, // هترجع ملياااانة أسماء لأننا عملنا بوبيليت في أول خطوة فوق!
    });
  } catch (error) {
    console.log("❌ حصل كارثة أو إيرور مفاجئ:");
    console.log(error.message);
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
