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
var axios_1 = require("axios");
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["GET"] = "GET";
    RequestMethod["POST"] = "POST";
    RequestMethod["PATCH"] = "PATCH";
    RequestMethod["DELETE"] = "DELETE";
    RequestMethod["OPTION"] = "OPTION";
    RequestMethod["HEAD"] = "HEAD";
})(RequestMethod || (RequestMethod = {}));
var DOPEClient = /** @class */ (function () {
    function DOPEClient() {
        var _this = this;
        this.apiRequest = function (path, method, headers) {
            if (method === void 0) { method = RequestMethod.GET; }
            if (headers === void 0) { headers = {}; }
            return __awaiter(_this, void 0, Promise, function () {
                var data, error_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.client({
                                    url: path,
                                    method: method,
                                    headers: headers,
                                })];
                        case 1:
                            data = (_b.sent()).data;
                            if (data.status === "ok") {
                                return [2 /*return*/, data];
                            }
                            else {
                                throw new Error(((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.message) || "API Request Failed");
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _b.sent();
                            throw new Error(error_1.message || "Server Error");
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        this.getHomeFeed = function (limit, random) {
            if (limit === void 0) { limit = 10; }
            if (random === void 0) { random = true; }
            return __awaiter(_this, void 0, Promise, function () {
                var result, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.apiRequest("/v1/posts?limit=".concat(limit, "&random=").concat(random))];
                        case 1:
                            result = _a.sent();
                            if (result && result.posts) {
                                return [2 /*return*/, result.posts];
                            }
                            else {
                                console.error("Error fetching posts:", result.message || result.error || "No error message");
                                return [2 /*return*/, null];
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            console.error(error_2.message);
                            return [2 /*return*/, null];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        this.client = axios_1.default.create({
            baseURL: "https://api.dopp.eu.org",
            timeout: 60 * 1000
        });
    }
    DOPEClient.getInstance = function () {
        if (!this.instance) {
            this.instance = new DOPEClient();
        }
        return this.instance;
    };
    return DOPEClient;
}());
exports.default = DOPEClient;
