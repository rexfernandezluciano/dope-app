"use strict";
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
exports.deleteSecure = exports.getSecure = exports.saveSecure = void 0;
/** @format */
var SecureStore = require("expo-secure-store");
var Crypto = require("expo-crypto");
var DEFAULT_ENCRYPTION_KEY_NAME = "82kedC1LibAGXyt+k9GoT3LgxrSh2eXDj3ssTZqPDnw=";
// Helper function to generate or retrieve an encryption key
function getEncryptionKey() {
    return __awaiter(this, void 0, Promise, function () {
        var key, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, SecureStore.getItemAsync(DEFAULT_ENCRYPTION_KEY_NAME)];
                case 1:
                    key = _a.sent();
                    if (!!key) return [3 /*break*/, 4];
                    return [4 /*yield*/, Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, Math.random().toString())];
                case 2:
                    key = _a.sent();
                    return [4 /*yield*/, SecureStore.setItemAsync(DEFAULT_ENCRYPTION_KEY_NAME, key)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, key];
                case 5:
                    error_1 = _a.sent();
                    console.error("Error getting/generating encryption key:", error_1);
                    throw new Error("Failed to get encryption key."); // Re-throw for handling upstream
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Helper functions for encryption/decryption
function encryptData(data) {
    return __awaiter(this, void 0, Promise, function () {
        var key, iv, ivString, cryptoResult, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getEncryptionKey()];
                case 1:
                    key = _a.sent();
                    return [4 /*yield*/, Crypto.generateRandom(16)];
                case 2:
                    iv = _a.sent();
                    ivString = Array.from(iv, function (byte) { return String.fromCharCode(byte); }).join("");
                    return [4 /*yield*/, Crypto.encryptAsync({
                            data: data,
                            key: key,
                            iv: ivString,
                        }, {
                            algorithm: Crypto.CryptoAlgorithm.AES256,
                            encoding: Crypto.CryptoEncoding.BASE64,
                        })];
                case 3:
                    cryptoResult = _a.sent();
                    return [2 /*return*/, JSON.stringify({ iv: ivString, data: cryptoResult })]; // Store IV with encrypted data
                case 4:
                    error_2 = _a.sent();
                    console.error("Encryption error:", error_2);
                    throw new Error("Failed to encrypt data.");
                case 5: return [2 /*return*/];
            }
        });
    });
}
function decryptData(encryptedData) {
    return __awaiter(this, void 0, Promise, function () {
        var key, parsedData, iv, data, decryptedData, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getEncryptionKey()];
                case 1:
                    key = _a.sent();
                    parsedData = JSON.parse(encryptedData);
                    iv = parsedData.iv;
                    data = parsedData.data;
                    return [4 /*yield*/, Crypto.decryptAsync({
                            data: data,
                            key: key,
                            iv: iv,
                        }, {
                            algorithm: Crypto.CryptoAlgorithm.AES256,
                            encoding: Crypto.CryptoEncoding.BASE64,
                        })];
                case 2:
                    decryptedData = _a.sent();
                    return [2 /*return*/, decryptedData];
                case 3:
                    error_3 = _a.sent();
                    console.error("Decryption error:", error_3);
                    throw new Error("Failed to decrypt data.");
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Save secure data
var saveSecure = function (key, value, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(void 0, void 0, Promise, function () {
        var expiration, _a, encrypt, dataToStore, expirationTimestamp, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    expiration = options.expiration, _a = options.encrypt, encrypt = _a === void 0 ? false : _a;
                    dataToStore = value;
                    if (!encrypt) return [3 /*break*/, 2];
                    return [4 /*yield*/, encryptData(value)];
                case 1:
                    dataToStore = _b.sent();
                    _b.label = 2;
                case 2:
                    if (expiration) {
                        expirationTimestamp = expiration.getTime();
                        dataToStore = JSON.stringify({ value: dataToStore, expiration: expirationTimestamp });
                    }
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, SecureStore.setItemAsync(key, dataToStore)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _b.sent();
                    console.error("Error saving secure data:", error_4);
                    throw new Error("Failed to save secure data."); // Re-throw for handling upstream
                case 6: return [2 /*return*/];
            }
        });
    });
};
exports.saveSecure = saveSecure;
// Retrieve secure data
var getSecure = function (key, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(void 0, void 0, Promise, function () {
        var _a, encrypt, storedData, parsedData, value, expiration, decryptedValue, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = options.encrypt, encrypt = _a === void 0 ? false : _a;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, SecureStore.getItemAsync(key)];
                case 2:
                    storedData = _b.sent();
                    if (!storedData) {
                        return [2 /*return*/, null];
                    }
                    parsedData = void 0;
                    try {
                        parsedData = JSON.parse(storedData);
                    }
                    catch (e) {
                        // If it's not JSON, assume it's a plain string (backward compatibility)
                        parsedData = { value: storedData, expiration: null };
                    }
                    value = parsedData.value, expiration = parsedData.expiration;
                    if (!(expiration && new Date().getTime() > expiration)) return [3 /*break*/, 4];
                    // Data has expired, delete it
                    return [4 /*yield*/, (0, exports.deleteSecure)(key)];
                case 3:
                    // Data has expired, delete it
                    _b.sent();
                    return [2 /*return*/, null];
                case 4:
                    decryptedValue = value;
                    if (!encrypt) return [3 /*break*/, 6];
                    return [4 /*yield*/, decryptData(value)];
                case 5:
                    decryptedValue = _b.sent();
                    _b.label = 6;
                case 6: return [2 /*return*/, decryptedValue];
                case 7:
                    error_5 = _b.sent();
                    console.error("Error retrieving secure data:", error_5);
                    return [2 /*return*/, null]; // Or throw an error, depending on your needs
                case 8: return [2 /*return*/];
            }
        });
    });
};
exports.getSecure = getSecure;
// Delete secure data
var deleteSecure = function (key) { return __awaiter(void 0, void 0, Promise, function () {
    var error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, SecureStore.deleteItemAsync(key)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error("Error deleting secure data:", error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteSecure = deleteSecure;
