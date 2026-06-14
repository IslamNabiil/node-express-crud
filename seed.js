const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const User = require("./model/userModel"); // الموديل بتاعك
require("dotenv").config(); // عشان يقرأ رابط الداتابيز من الـ .env
const MONGODB_URI = process.env.MONGODB_URI;

const seedUsers = async () => {
  try {
    // 1. الاتصال بقاعدة البيانات
    await mongoose.connect(
      MONGODB_URI || "mongodb://127.0.0.1:27017/codeagain",
    );
    console.log("Connected to MongoDB for seeding... 🌱");

    // 2. مسح البيانات القديمة (اختياري، لو عايز تبدأ على نظافة)
    await User.deleteMany({});
    console.log("Old users cleared!");

    // 3. تجهيز مصفوفة بـ 50 مستخدم وهمي
    const fakeUsers = [];
    for (let i = 0; i < 50; i++) {
      fakeUsers.push({
        name: faker.person.fullName(), // بيولد اسم كامل حقيقي
        email: faker.internet.email(), // بيولد إيميل مظبوط وصح
      });
    }

    // 4. حفظ الـ 50 مستخدم دفعة واحدة في الداتابيز
    await User.insertMany(fakeUsers);
    console.log("🎯 Successfully seeded 50 fake users into the database!");

    // 5. قفل الاتصال بعد ما خلصنا
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding data:", error);
    mongoose.connection.close();
  }
};

// تشغيل الدالة
seedUsers();
