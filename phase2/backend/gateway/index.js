import express from "express"
import dotenv from "dotenv"
import proxy from "express-http-proxy"
dotenv.config()

const port = process.env.PORT || 5000

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:8001";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://order-service:8002";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:8003";

const app = express()

app.use(express.json())

app.get("/", (req, res) => {
    return res.status(200).json({ message: `hello from ${process.env.SERVER_NAME}` });
})

app.use("/auth", proxy(AUTH_SERVICE_URL));
app.use("/order", proxy(ORDER_SERVICE_URL));
app.use("/product", proxy(PRODUCT_SERVICE_URL));

app.listen(port, () => {
    console.log(`server started ${port}`)
})