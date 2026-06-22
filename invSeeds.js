require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker"); // 🛠️ تم تصحيح الكلمة
const Invoice = require("./model/invoiceModel");
const User = require("./model/userModel");       // 🔥 استدعينا موديل العملاء
const Product = require("./model/productModel"); // 🔥 استدعينا موديل المنتجات
const Counter = require("./model/counterModel"); // 🔥 استدعينا العداد عشان نخليه يبدأ صح

const MONGODB = process.env.MONGODB_URI;

const invSeed = async () => { // 🛠️ شيلنا req, res لأن السكريبت بيشتغل لوحده من الـ Terminal
  try {
    await mongoose.connect(MONGODB);
    console.log("DB has connected successfully ✔");

    // 1️⃣ مسح البيانات القديمة للفواتير والعدادات
    await Invoice.deleteMany({});
    await Counter.deleteMany({ id: "invoiceSerial" }); // بنصفر العداد عشان يبدأ من INV-00001
    console.log("Old invoices and counters have been deleted successfully ✔");

    // 2️⃣ ⚡ [أهم خطوة]: سحب العملاء والمنتجات الحقيقية من الداتابيز
    const allUsers = await User.find({}, "_id");
    const allProducts = await Product.find({}, "_id sellingPrice name");

    if (allUsers.length === 0 || allProducts.length === 0) {
      console.log("⚠️ عفواً! يجب أن تحتوي قاعدة البيانات على مستخدمين ومنتجات أولاً قبل توليد الفواتير.");
      mongoose.connection.close();
      return;
    }

    const fakeData = [];
    console.log("⏳ جاري توليد 500 فاتورة وهمية منطقية...");

    // 3️⃣ اللوب لإنشاء الـ 500 فاتورة
    for (let i = 1; i <= 500; i++) {
      
      // أ) اختيار عميل عشوائي حقيقي من الداتابيز
      const randomCustomer = faker.helpers.arrayElement(allUsers)._id;

      // ب) تحديد عدد عشوائي من الأصناف جوه الفاتورة الواحدة (مثلاً من صنف لـ 4 أصناف)
      const itemsCount = faker.number.int({ min: 1, max: 4 });
      const invoiceItems = [];
      let subTotal = 0;

      for (let j = 0; j < itemsCount; j++) {
        // اختيار منتج عشوائي حقيقي
        const randomProduct = faker.helpers.arrayElement(allProducts);
        const quantity = faker.number.int({ min: 1, max: 5 });
        const price = randomProduct.sellingPrice;

        subTotal += price * quantity;

        invoiceItems.push({
          product: randomProduct._id,
          quantity: quantity,
          price: price
        });
      }

      // ج) حسابات الخصم والصافي
      const discount = faker.helpers.arrayElement([0, 10, 15, 20, 50]); // قيم خصم عشوائية شيك
      const totalAmount = Math.max(0, subTotal - discount); // لضمان عدم ظهور أرقام بالسالب

      // د) توليد رقم مسلسل الفاتورة محاكي للعداد الحقيقي (INV-00001 لحد INV-00500)
      const invoiceNumber = `INV-${i.toString().padStart(5, "0")}`;


      // هـ) رمي كائن الفاتورة الجاهز في المصفوفة العملاقة
      fakeData.push({
        invoiceNumber,
        customer: randomCustomer,
        items: invoiceItems,
        subTotal: parseFloat(subTotal.toFixed(2)), // تقريب عشري محاسبي مظبوط
        discount,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        createdAt: faker.date.past({ years: 1 }) // تواريخ فواتير قديمة عشوائية على مدار سنة للمراجعة الحسابية
      });
    }

    // 4️⃣ حفظ الـ 500 فاتورة دفعة واحدة في الداتابيز لسرعة الأداء (Bulk Insert)
    await Invoice.insertMany(fakeData);
    console.log("✅ تم حفظ 500 فاتورة وهمية بنجاح جوه قاعدة البيانات!");

    // 5️⃣ تحديث العداد الحقيقي عشان لما تيجي تكريت فاتورة يدوية من Postman يبدأ من INV-00501
    await Counter.create({ id: "invoiceSerial", seq: 500 });
    console.log("🔢 تم ضبط مسلسل العداد الحقيقي على الرقم 500 بنجاح.");

    console.log("🔌 جاري إغلاق الاتصال بقاعدة البيانات...");
    mongoose.connection.close();
    console.log("🏁 انتهت العملية بسلام!");

  } catch (error) {
    console.error("❌ Error seeding data: ", error);
    mongoose.connection.close();
  }
};

invSeed();