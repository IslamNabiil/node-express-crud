const Inv = require("../model/invoiceModel");

exports.getSalesReport = async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let dateFilter = {};

    if (startDate || endDate) {
      dateFilter.createdAt = {};

      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const report = await Inv.aggregate([
      {
        $match: dateFilter,
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
      {
        $sort: { netSales: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // const data =
    //   report.length > 0
    //     ? report[0]
    //     : { totalSales: 0, totalDiscount: 0, netSales: 0, invoiceCount: 0 };

    res.status(200).json({
      message: "Financial Sales Report Generated Successfully ✅📊",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};

exports.getTopProductsReport = async (req, res) => {
  try {
    const report = await Inv.aggregate([
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productName",
          totalQuantitySold: { $sum: "$items.quantity" },
          totalProductRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      {
        $sort: { totalProductRevenue: -1 },
      },
      {
        $limit: 5,
      },
    ]);
    res.status(200).json({
      message: "Top Products Report Generated Successfully 📊✅",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error ❌",
      error: error.message,
    });
  }
};
