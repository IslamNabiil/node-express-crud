require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const productModel = require("./model/productModel");

const MONGODB = process.env.MONGODB_URI;

const productSeed = async (req, res) => {
  try {
    await mongoose.connect(MONGODB);
    console.log("DB has connected successfully ✔");

    await productModel.deleteMany({});
    console.log("Old data has been deleted successfully ✔");

    const fakeData = [];
    for (let i = 0; i < 500; i++) {
      const purchasePrice = parseFloat(
        faker.commerce.price({ min: 10, max: 500 }),
      );

      const sellingPrice =
        purchasePrice + parseFloat(faker.commerce.price({ min: 5, max: 100 }));

      fakeData.push({
        productCode: `PROD-${faker.string.alphanumeric(5).toUpperCase()}`,
        category: faker.commerce.department(),
        name: faker.commerce.productName(),
        purchasePrice: purchasePrice,
        sellingPrice: sellingPrice,
        quantity: faker.number.int({ min: 0, max: 200 }),
      });
    }

    await productModel.insertMany(fakeData);
    console.log("The new data has been planted successfully ✔");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding data: ", error);
    mongoose.connection.close();
  }
};

productSeed();
