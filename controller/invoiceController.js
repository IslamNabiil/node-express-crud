const Product = require("../model/productModel");
const Invoice = require("../model/invoiceModel");
const Counter = require("../model/counterModel");

exports.createInvoice = async (req, res) => {
  try {
    const { discount, customer, items } = req.body;
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ message: "All fields are required ❌" });
    }

    let subTotal = 0;
    const invoiceItems = [];
    const productsToUpdate = []; // مصفوفة مؤقتة هنشيل فيها المنتجات الجاهزة للتحديث

    // ================== 🔄 الشوط الأول: لوب الفحص والأمان فقط ==================
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product with ID ${item.product} not found ❌` });
      }

      if (item.quantity > product.quantity) {
        // لو صنف واحد باظ، هيعمل return فورا والمخزن لم يُلمس!
        return res.status(400).json({
          message: `We don't have enough ${product.name} in stock, we only have ${product.quantity} in stock ❌`,
        });
      }

      const itemPrice = product.sellingPrice;
      subTotal += itemPrice * item.quantity;

      invoiceItems.push({
        product: product._id,
        quantity: item.quantity,
        price: itemPrice,
      });

      // بنخزن الكائن والكمية المراد خصمها في الذاكرة مؤقتاً ومبنجريش نعمل save في الداتابيز حالا
      productsToUpdate.push({
        productDoc: product,
        quantityToDeduct: item.quantity,
      });
    }
    // =========================================================================

    // ================== 📦 الشوط الثاني: لوب التحديث الفعلي للمخزن ==================
    // السيرفر مش هيروح للسطور دي إلا لو كل الأصناف فوق نجحت في الفحص 100%
    for (const update of productsToUpdate) {
      update.productDoc.quantity -= update.quantityToDeduct;
      await update.productDoc.save(); // الحفظ الآمن في الداتابيز
    }
    // =========================================================================

    // ولد رقم الفاتورة النظيف بالمسلسل
    const counter = await Counter.findOneAndUpdate(
      { id: "invoiceSerial" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true },
    );

    const invoiceNumber = `INV-${counter.seq.toString().padStart(5, "0")}`;

    const discountAmount = discount || 0;
    const totalAmount = subTotal - discountAmount;

    // حفظ الفاتورة
    const newInvoice = await Invoice.create({
      invoiceNumber,
      discount: discountAmount,
      customer: customer,
      items: invoiceItems,
      subTotal,
      totalAmount,
    });

    const populatedInvoice = await newInvoice
      .populate("customer", "name email")
      .populate("items.product", "name productCode");

    res.status(201).json({
      message: `Invoice number ${invoiceNumber} has been added successfully ✔`,
      data: populatedInvoice,
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
    console.log(`🚀 Starging to delete the ID: ${invoiceId}`);

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
      `👀 We've catched the invoice : ${selectedInvoice.invoiceNumber}`,
    );
    console.log(`👤 Customer's name : ${selectedInvoice.customer.name}`);

    // 2️⃣ اللوب لإرجاع البضاعة للمخزن
    console.log("📦 refund the storage ...");
    for (const item of selectedInvoice.items) {
      // 🔥 كشاف الـ Console: بنشوف الصنف اللي عليه الدور باصص لإيه
      console.log(
        `   🔸 Current product's name : "${item.product.name}"، and it's ID : ${item.product._id}`,
      );

      const product = await Product.findById(item.product._id); // سحبنا الصنف بـ ID الصافي المترجم

      if (product) {
        console.log(
          `      Quantity before refund: [${product.quantity}] | refund's quantity : [${item.quantity}]`,
        );

        product.quantity += item.quantity; // رد البضاعة
        await product.save();

        console.log(
          `      ✅ the new storage's quantity is here : [${product.quantity}]`,
        );
      }
    }

    // 3️⃣ الحذف الفعلي بعد ما أخذنا نسختنا المترجمة وجردنا المخزن
    await Invoice.findByIdAndDelete(invoiceId);
    console.log("🗑️ the Invoice has been deleted from the DB successfully");

    // 4️⃣ الرد النهائي بالداتا المترجمة الجاهزة في الذاكرة
    console.log("✨ Sending the data from the postman to the DB...");
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
