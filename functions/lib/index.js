"use strict";
/**
 * Firebase Cloud Functions for ConvenientStore POS
 *
 * Secure customer search service that allows POS to search customers
 * without exposing sensitive customer data.
 *
 * Role management for two-collection security model:
 * - Admin role: Full access to pending_transactions and final_invoices
 * - Employee role: Write-only access to pending_transactions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerBasicInfo = exports.searchCustomers = exports.getUserRole = exports.setUserRole = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Owner UID (hardcoded for security)
const OWNER_UID = "z1f8hRtgquUjTOmrM3bLSmvy5R73";
/**
 * Set User Role (Admin-Only)
 *
 * Allows admin to set custom claims (roles) for users
 * Only the owner can call this function
 *
 * Roles:
 * - admin: Full access to all collections and operations
 * - employee: Limited access (write-only to pending_transactions)
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
    // Verify the caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated to set user roles");
    }
    // Verify the caller is the owner
    if (context.auth.uid !== OWNER_UID) {
        throw new functions.https.HttpsError("permission-denied", "Only the owner can set user roles");
    }
    const { userId, role } = data;
    // Validate input
    if (!userId || typeof userId !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "User ID is required");
    }
    if (!role || !["admin", "employee"].includes(role)) {
        throw new functions.https.HttpsError("invalid-argument", "Role must be 'admin' or 'employee'");
    }
    try {
        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, { role });
        functions.logger.info(`Set role '${role}' for user ${userId}`, {
            caller: context.auth.uid,
            targetUser: userId,
            role: role,
        });
        return {
            success: true,
            message: `User ${userId} now has role: ${role}`,
            userId,
            role,
        };
    }
    catch (error) {
        functions.logger.error("Set user role error:", error);
        throw new functions.https.HttpsError("internal", "Failed to set user role");
    }
});
/**
 * Get User Role
 *
 * Returns the current user's role from custom claims
 * Useful for debugging and UI display
 */
exports.getUserRole = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated");
    }
    try {
        const user = await admin.auth().getUser(context.auth.uid);
        const role = ((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role) || null;
        return {
            success: true,
            userId: context.auth.uid,
            role: role,
            isOwner: context.auth.uid === OWNER_UID,
        };
    }
    catch (error) {
        functions.logger.error("Get user role error:", error);
        throw new functions.https.HttpsError("internal", "Failed to get user role");
    }
});
/**
 * Secure Customer Search Function
 *
 * Allows POS (with anonymous auth) to search for customers by:
 * - Name (partial match, case-insensitive)
 * - Phone number (exact or partial match)
 *
 * Returns only non-sensitive data:
 * - Customer ID
 * - Name
 * - Phone number
 *
 * Does NOT return:
 * - Email
 * - Address
 * - Purchase history
 * - Notes
 */
exports.searchCustomers = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify the user is authenticated (anonymous or email/password)
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated to search customers");
    }
    const query = (_a = data.query) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    // Validate input
    if (!query || query.length < 2) {
        throw new functions.https.HttpsError("invalid-argument", "Search query must be at least 2 characters");
    }
    try {
        const db = admin.firestore();
        const customersRef = db.collection("customers");
        // Search by name or phone number
        const snapshot = await customersRef.get();
        const results = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const name = (data.name || "").toLowerCase();
            const phone = (data.phoneNumber || "").replace(/\D/g, ""); // Remove non-digits
            const searchPhone = query.replace(/\D/g, "");
            // Match by name (partial) or phone (partial)
            if (name.includes(query) ||
                (searchPhone && phone.includes(searchPhone))) {
                results.push({
                    id: doc.id,
                    name: data.name || "Unknown",
                    phone: data.phoneNumber || "",
                });
            }
        });
        // Limit results to 10 for performance
        const limitedResults = results.slice(0, 10);
        functions.logger.info(`Customer search: "${query}" found ${limitedResults.length} results`, { uid: context.auth.uid });
        return {
            success: true,
            customers: limitedResults,
            count: limitedResults.length,
        };
    }
    catch (error) {
        functions.logger.error("Customer search error:", error);
        throw new functions.https.HttpsError("internal", "Failed to search customers");
    }
});
/**
 * Get Single Customer (Limited Info)
 *
 * Allows POS to get basic info about a specific customer by ID
 * Returns only non-sensitive data needed for checkout
 */
exports.getCustomerBasicInfo = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated");
    }
    const customerId = (_a = data.customerId) === null || _a === void 0 ? void 0 : _a.trim();
    if (!customerId) {
        throw new functions.https.HttpsError("invalid-argument", "Customer ID is required");
    }
    try {
        const db = admin.firestore();
        const customerDoc = await db.collection("customers").doc(customerId).get();
        if (!customerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Customer not found");
        }
        const data = customerDoc.data();
        // Return only non-sensitive data
        return {
            success: true,
            customer: {
                id: customerDoc.id,
                name: (data === null || data === void 0 ? void 0 : data.name) || "Unknown",
                phone: (data === null || data === void 0 ? void 0 : data.phoneNumber) || "",
            },
        };
    }
    catch (error) {
        functions.logger.error("Get customer error:", error);
        throw new functions.https.HttpsError("internal", "Failed to get customer");
    }
});
//# sourceMappingURL=index.js.map