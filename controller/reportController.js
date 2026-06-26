const Inv = require("../model/invoiceModel");

exports.getSalesReport = async (req, res) => {
  try {
    const report = await Inv.aggregate([
      {
        $match: {},
      },
      {
        $group: {
          _id: "$customerName",
          totalSales: { $sum: "$subTotal" },
          totalDiscount: { $sum: "$discount" },
          netSales: { $sum: "$totalAmount" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    // const data =
    //   report.length > 0
    //     ? report[0]
    //     : { totalSales: 0, totalDiscount: 0, netSales: 0, invoiceCount: 0 };

    res.status(200).json({
        message: "Financial Sales Report Generated Successfully ✅📊",
        data: report,
    })
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
