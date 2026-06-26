const express = require("express");
const router = express.Router();

const reportController = require("../controller/reportController");

router.get("/top-sales", reportController.getSalesReport);
router.get("/top-products", reportController.getTopProductsReport);

module.exports = router;
