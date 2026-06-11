"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const express_1 = require("@clerk/express");
const requireAuth = async (req, res, next) => {
    const auth = (0, express_1.getAuth)(req);
    if (!("userId" in auth) || !auth.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};
exports.requireAuth = requireAuth;
