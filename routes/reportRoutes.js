const express = require("express");
const router = express.Router();

const reportController = require("../controller/reportController");

router.get("/sales-report", reportController.getSalesReport);
router.get("/products-report", reportController.getTopProductsReport);

module.exports = router;
