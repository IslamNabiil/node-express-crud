const User = require("../model/userModel");
const Invoice = require("../model/invoiceModel");
const ReturnInvoice = require("../model/returnInvoiceModel");

exports.getAllUsers = async (req, res) => {
  try {
    const queryObj = { ...req.query };

    const excludedFields = ["page", "limit", "sort", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    Object.keys(queryObj).forEach((key) => {
      if (
        typeof queryObj[key] === "string" &&
        key !== "email" &&
        key !== "sex"
      ) {
        queryObj[key] = { $regex: queryObj[key], $options: "i" };
      }
    });

    let query = User.find(queryObj);

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (req.query.sort) {
      query = query.sort(req.query.sort);
    } else {
      query = query.sort("_id");
    }

    const totalUsers = await User.countDocuments(queryObj);

    const users = await query.skip(skip).limit(limit);
    // const users = await User.find(queryObj).skip(skip).limit(limit);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      message: `We've catched ${totalUsers} users successfully ✔`,
      pages: `Page ${page} out of ${totalPages}`,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      color,
      petName,
      gender,
      sexType,
      sex,
      balance,
    } = req.body;
    const newUser = await User.create({
      name,
      email,
      password,
      color,
      petName,
      gender,
      sexType,
      sex,
      balance,
    });
    res.status(201).json({
      message: "new User has been created successfully ✔",
      data: newUser,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found ❌",
      });
    }
    res.status(200).json({
      message: "User has been catched successfully ✔",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found ❌",
      });
    }
    res.status(200).json({
      message: "User has been deleted Successfully ✔",
      data: deletedUser,
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true },
    );
    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found ❌",
      });
    }
    res.status(200).json({
      message: "User has been updated Successfully ✔",
      oldData: updatedUser,
      newData: { name, email },
    });
  } catch (error) {
    res.status(400).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getCustomerLedger = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: `User with the id : ${id} not found ❌`,
      });
    }

    const ledger = [];
    const invoices = await Invoice.find({ customer: id });
    const returnInvoice = await ReturnInvoice.find({ customer: id });

    for (let inv of invoices) {
      const data = {
        type: "invoice",
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        subTotal: inv.subTotal,
        discount: inv.discount,
        totalAmount: inv.totalAmount,
        balanceBefore: inv.balanceBefore,
        balanceAfter: inv.balanceAfter,
      };

      ledger.push(data);
    }

    for (let inv of returnInvoice) {
      const data = {
        type: "returnInvoice",
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        subTotal: inv.subTotal,
        discount: inv.discount,
        totalAmount: inv.totalAmount,
        balanceBefore: inv.balanceBefore,
        balanceAfter: inv.balanceAfter,
      };

      ledger.push(data);
    }

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    //sales section
    const totalSalesBeforeDiscount = ledger
      .filter((item) => item.type === "invoice")
      .reduce((sum, item) => sum + item.subTotal, 0);

    const totalSalesDiscount = ledger
      .filter((item) => item.type === "invoice")
      .reduce((sum, item) => sum + item.discount, 0);

    const totalSalesAfterDiscount = ledger
      .filter((item) => item.type === "invoice")
      .reduce((sum, item) => sum + item.totalAmount, 0);

    //return section
    const totalReturnSalesBeforeDiscount = ledger
      .filter((item) => item.type === "returnInvoice")
      .reduce((sum, item) => sum + item.subTotal, 0);

    const totalReturnSalesDiscount = ledger
      .filter((item) => item.type === "returnInvoice")
      .reduce((sum, item) => sum + item.discount, 0);

    const totalReturnSalesAfterDiscount = ledger
      .filter((item) => item.type === "returnInvoice")
      .reduce((sum, item) => sum + item.totalAmount, 0);

    const netSalesBeforeDiscount =
      totalSalesBeforeDiscount - totalReturnSalesBeforeDiscount;
    const netSalesDiscount = totalSalesDiscount - totalReturnSalesDiscount;
    const netSales = totalSalesAfterDiscount - totalReturnSalesAfterDiscount;

    //Purchases - totalReturns;

    return res.status(200).json({
      message: `Customer with the id: ${id} Ledger is ready to deploy ✅`,
      customerInfo: {
        name: user.name,
        email: user.email,
        balance: user.balance,
      },
      summary: {
        Sales: {
          gross: totalSalesBeforeDiscount,
          discount: totalSalesDiscount,
          net: totalSalesAfterDiscount,
        },
        Returns: {
          gross: totalReturnSalesBeforeDiscount,
          discount: totalReturnSalesDiscount,
          net: totalReturnSalesAfterDiscount,
        },
        "Net Sales": {
          gross: netSalesBeforeDiscount,
          discount: netSalesDiscount,
          net: netSales,
        },
      },
      data: ledger,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
