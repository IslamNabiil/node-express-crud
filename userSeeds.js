require("dotenv").config();
const mongoose = require("mongoose");
const userModel = require("./model/userModel");
const { faker } = require("@faker-js/faker");

const MONGODB = process.env.MONGODB_URI;
const MONGOATLAS_URI = process.env.MONGOATLAS_URI;

const user = async (req, res) => {
  try {
    await mongoose.connect(MONGOATLAS_URI);
    console.log("DB has connected successfully ✔");

    await userModel.deleteMany({});
    console.log("Old data has been deleted successfully ✔");

    const fakeData = [];
    for (let i = 0; i < 50; i++) {
      fakeData.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        color: faker.color.human(),
        petName: faker.animal.petName(),
        gender: faker.person.gender(),
        sexType: faker.person.sexType(),
        sex: faker.person.sex(),
        balance: faker.number.int({ min: 0, max: 10000})
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

user();
