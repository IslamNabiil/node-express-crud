require("dotenv").config();
const mongoose = require("mongoose");
const userModel = require("./model/userModel");
const { faker } = require("@faker-js/faker");

const MONGODB = process.env.MONGODB_URI;

const speed = async (req, res) => {
  try {
    await mongoose.connect(MONGODB);
    console.log("DB has connected successfully ✔");

    await userModel.deleteMany({});
    console.log("Old data has been deleted successfully ✔");

    const fakeData = [];
    for (let i = 0; i < 500; i++) {
      fakeData.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        color: faker.color.human(),
        petName: faker.animal.petName(),
        gender: faker.person.gender(),
      });
    }

    await userModel.insertMany(fakeData);
    console.log("The new data has been planted successfully ✔");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding data:", error);
    mongoose.connection.close();
  }
};

speed();
