"use strict";
/** @format */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var DOPEClient_1 = require("../api/config/DOPEClient");
var storage_utils_ts_1 = require("../utils/storage.utils.ts");
var AuthService = /** @class */ (function () {
    function AuthService() {
        var _this = this;
        this.currentUser = null;
        this.authToken = null;
        this.fecthAuth = function () { return __awaiter(_this, void 0, void 0, function () {
            var token, me, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, (0, storage_utils_ts_1.getSecure)("authToken", { encrypt: true })];
                    case 1:
                        token = _a.sent();
                        if (!token) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.apiRequest("/v1/auth/me", DOPEClient_1.RequestMethod.GET, {}, { Authorization: "Bearer ".concat(this.authToken) })];
                    case 2:
                        me = _a.sent();
                        if (me.status === "ok") {
                            this.authToken = token;
                            this.currentUser = me.user;
                            return [2 /*return*/, me.user];
                        }
                        else {
                            return [2 /*return*/, null];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.client = DOPEClient_1.default.getInstance();
        this.fecthAuth()
            .then(function (data) { return console.log("success"); })
            .catch(function (err) { return console.error("failed"); });
    }
    // Authentication Methods
    AuthService.prototype.login = function (credentials) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, token, sessionId, user, message, expirationDate, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.client.apiRequest("/v1/auth/login", DOPEClient_1.RequestMethod.POST, credentials)];
                    case 1:
                        _a = _b.sent(), token = _a.token, sessionId = _a.sessionId, user = _a.user, message = _a.message;
                        if (!token) return [3 /*break*/, 3];
                        this.authToken = token;
                        this.currentUser = user;
                        expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + 7);
                        return [4 /*yield*/, (0, storage_utils_ts_1.saveSecure)("authToken", token, { encrypt: true, expiration: expirationDate })];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, { success: true, user: user }];
                    case 3: return [2 /*return*/, { success: false, error: message || "Login failed" }];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_2 = _b.sent();
                        return [2 /*return*/, { success: false, error: error_2.message || error_2 || "Network error" }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.register = function (userData) {
        return __awaiter(this, void 0, Promise, function () {
            var response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/register"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(userData),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (response.ok) {
                            return [2 /*return*/, { success: true, verificationId: data.verificationId }];
                        }
                        else {
                            return [2 /*return*/, { success: false, error: data.message || "Registration failed" }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        return [2 /*return*/, { success: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.verifyEmail = function (email, code, verificationId) {
        return __awaiter(this, void 0, Promise, function () {
            var response, data, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/verify-email"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ email: email, code: code, verificationId: verificationId }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (response.ok) {
                            return [2 /*return*/, { success: true }];
                        }
                        else {
                            return [2 /*return*/, { success: false, error: data.message || "Verification failed" }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        return [2 /*return*/, { success: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.getCurrentUser = function () {
        return __awaiter(this, void 0, Promise, function () {
            var response, data, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.authToken) {
                            return [2 /*return*/, { success: false, error: "Not authenticated" }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/me"), {
                                method: "GET",
                                headers: {
                                    Authorization: "Bearer ".concat(this.authToken),
                                    "Content-Type": "application/json",
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        if (response.ok) {
                            this.currentUser = data.user;
                            return [2 /*return*/, { success: true, user: data.user }];
                        }
                        else {
                            return [2 /*return*/, { success: false, error: data.message || "Failed to get user" }];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        return [2 /*return*/, { success: false, error: "Network error" }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.logout = function () {
        return __awaiter(this, void 0, Promise, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.authToken) {
                            return [2 /*return*/, { success: true }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/logout"), {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer ".concat(this.authToken),
                                    "Content-Type": "application/json",
                                },
                            })];
                    case 2:
                        _a.sent();
                        this.authToken = null;
                        this.currentUser = null;
                        return [2 /*return*/, { success: true }];
                    case 3:
                        error_6 = _a.sent();
                        // Clear local auth even if request fails
                        this.authToken = null;
                        this.currentUser = null;
                        return [2 /*return*/, { success: true }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // User Management Methods
    AuthService.prototype.checkUsernameAvailability = function (username) {
        return __awaiter(this, void 0, Promise, function () {
            var response, data, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/check-username"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ username: username }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, { available: data.available }];
                    case 3:
                        error_7 = _a.sent();
                        return [2 /*return*/, { available: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.checkEmailAvailability = function (email) {
        return __awaiter(this, void 0, Promise, function () {
            var response, data, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/check-email"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ email: email }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, { available: data.available }];
                    case 3:
                        error_8 = _a.sent();
                        return [2 /*return*/, { available: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.forgotPassword = function (email) {
        return __awaiter(this, void 0, Promise, function () {
            var response, data, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/forgot-password"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ email: email }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (response.ok) {
                            return [2 /*return*/, { success: true, resetId: data.resetId }];
                        }
                        else {
                            return [2 /*return*/, { success: false, error: data.message || "Failed to send reset code" }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_9 = _a.sent();
                        return [2 /*return*/, { success: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.resetPassword = function (email, code, resetId, newPassword) {
        return __awaiter(this, void 0, Promise, function () {
            var response, data, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.client.baseURL, "/v1/auth/reset-password"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ email: email, code: code, resetId: resetId, newPassword: newPassword }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (response.ok) {
                            return [2 /*return*/, { success: true }];
                        }
                        else {
                            return [2 /*return*/, { success: false, error: data.message || "Password reset failed" }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_10 = _a.sent();
                        return [2 /*return*/, { success: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(AuthService.prototype, "user", {
        // Getters
        get: function () {
            return this.currentUser;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "token", {
        get: function () {
            return this.authToken;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "isAuthenticated", {
        get: function () {
            return !!this.authToken && !!this.currentUser;
        },
        enumerable: false,
        configurable: true
    });
    return AuthService;
}());
exports.default = new AuthService();
