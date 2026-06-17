"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_2 = require("@clerk/express");
const auth_middleware_1 = require("./middleware/auth.middleware");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const upload_route_1 = __importDefault(require("./routes/upload.route"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, express_2.clerkMiddleware)());
app.use("/uploads", upload_route_1.default);
app.use("/transactions", transaction_routes_1.default);
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Traqr API is running",
    });
});
app.get("/test", auth_middleware_1.requireAuth, (req, res) => {
    const { userId } = (0, express_2.getAuth)(req);
    res.json({ message: "You're in!", userId });
});
app.listen(5000, "0.0.0.0", () => {
    console.log('Server is running on port 5000');
});
exports.default = app;
