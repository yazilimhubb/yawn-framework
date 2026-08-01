#pragma once
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <algorithm>
#include "expr_parser.hpp"

namespace yawnc {

enum class ValueType {
    Null,
    Bool,
    Number,
    String,
    Array,
    Object,
    Function,
};

struct YawnValue;
using YawnValuePtr = std::shared_ptr<YawnValue>;

struct YawnValue {
    ValueType type = ValueType::Null;
    bool bool_val = false;
    double num_val = 0.0;
    std::string str_val;
    std::vector<YawnValue> arr_val;
    std::map<std::string, YawnValue> obj_val;
    
    // Function representation
    std::vector<std::string> params;
    ASTNodePtr body;

    YawnValue() : type(ValueType::Null) {}
    explicit YawnValue(bool b) : type(ValueType::Bool), bool_val(b) {}
    explicit YawnValue(double n) : type(ValueType::Number), num_val(n) {}
    explicit YawnValue(const std::string& s) : type(ValueType::String), str_val(s) {}
    explicit YawnValue(const char* s) : type(ValueType::String), str_val(s) {}
    explicit YawnValue(std::vector<YawnValue> a) : type(ValueType::Array), arr_val(std::move(a)) {}
    explicit YawnValue(std::map<std::string, YawnValue> o) : type(ValueType::Object), obj_val(std::move(o)) {}
    YawnValue(std::vector<std::string> p, ASTNodePtr b) : type(ValueType::Function), params(std::move(p)), body(std::move(b)) {}

    bool is_truthy() const {
        switch (type) {
            case ValueType::Null: return false;
            case ValueType::Bool: return bool_val;
            case ValueType::Number: return num_val != 0.0;
            case ValueType::String: return !str_val.empty() && str_val != "false" && str_val != "0";
            case ValueType::Array: return true;
            case ValueType::Object: return true;
            case ValueType::Function: return true;
        }
        return false;
    }

    std::string to_string() const {
        switch (type) {
            case ValueType::Null: return "";
            case ValueType::Bool: return bool_val ? "true" : "false";
            case ValueType::Number: {
                std::ostringstream ss;
                ss << num_val;
                return ss.str();
            }
            case ValueType::String: return str_val;
            case ValueType::Array: {
                std::string res = "[";
                for (size_t i = 0; i < arr_val.size(); i++) {
                    if (i > 0) res += ",";
                    res += arr_val[i].to_json();
                }
                res += "]";
                return res;
            }
            case ValueType::Object: return "[object Object]";
            case ValueType::Function: return "() => { ... }";
        }
        return "";
    }

    std::string to_json() const {
        switch (type) {
            case ValueType::Null: return "null";
            case ValueType::Bool: return bool_val ? "true" : "false";
            case ValueType::Number: return to_string();
            case ValueType::String: return "\"" + str_val + "\""; // Simple escape omission for brevity
            case ValueType::Array: {
                std::string res = "[";
                for (size_t i = 0; i < arr_val.size(); i++) {
                    if (i > 0) res += ",";
                    res += arr_val[i].to_json();
                }
                res += "]";
                return res;
            }
            case ValueType::Object: {
                std::string res = "{";
                size_t i = 0;
                for (const auto& [k, v] : obj_val) {
                    if (i > 0) res += ",";
                    res += "\"" + k + "\":" + v.to_json();
                    i++;
                }
                res += "}";
                return res;
            }
            case ValueType::Function: return "null";
        }
        return "null";
    }
};

using Env = std::map<std::string, YawnValue>;

class ExprEvaluator {
public:
    explicit ExprEvaluator(Env env) : env_(std::move(env)) {}

    YawnValue evaluate(const ASTNodePtr& node) {
        if (!node) return YawnValue();

        switch (node->type) {
            case NodeType::NumberLiteral:
                return YawnValue(node->num_value);
            case NodeType::StringLiteral:
                return YawnValue(node->str_value);
            case NodeType::BoolLiteral:
                return YawnValue(node->bool_value);
            case NodeType::NullLiteral:
                return YawnValue();
            case NodeType::Identifier: {
                auto it = env_.find(node->str_value);
                if (it != env_.end()) return it->second;
                return YawnValue();
            }
            case NodeType::BinaryExpr:
                return eval_binary(node);
            case NodeType::UnaryExpr:
                return eval_unary(node);
            case NodeType::TernaryExpr: {
                auto cond = evaluate(node->condition);
                if (cond.is_truthy()) return evaluate(node->consequent);
                return evaluate(node->alternate);
            }
            case NodeType::MemberExpr:
                return eval_member(node);
            case NodeType::CallExpr:
                return eval_call(node);
            case NodeType::ArrayLiteral: {
                std::vector<YawnValue> arr;
                for (const auto& el : node->elements) {
                    if (el->type == NodeType::SpreadExpr) {
                        auto val = evaluate(el->spread_arg);
                        if (val.type == ValueType::Array) {
                            arr.insert(arr.end(), val.arr_val.begin(), val.arr_val.end());
                        }
                    } else {
                        arr.push_back(evaluate(el));
                    }
                }
                return YawnValue(arr);
            }
            case NodeType::ObjectLiteral: {
                std::map<std::string, YawnValue> obj;
                for (const auto& prop : node->properties) {
                    if (prop.key == "...") {
                        auto val = evaluate(prop.value);
                        if (val.type == ValueType::Object) {
                            obj.insert(val.obj_val.begin(), val.obj_val.end());
                        }
                    } else {
                        std::string k = prop.key;
                        if (prop.computed) {
                            k = evaluate(prop.value).to_string();
                        }
                        obj[k] = evaluate(prop.value);
                    }
                }
                return YawnValue(obj);
            }
            case NodeType::TemplateLiteral: {
                std::string res;
                for (const auto& p : node->tpl_parts) {
                    res += evaluate(p).to_string();
                }
                return YawnValue(res);
            }
            case NodeType::ArrowFunc: {
                return YawnValue(node->params, node->body);
            }
            case NodeType::TypeofExpr: {
                auto val = evaluate(node->typeof_arg);
                switch (val.type) {
                    case ValueType::Null: return YawnValue("object");
                    case ValueType::Bool: return YawnValue("boolean");
                    case ValueType::Number: return YawnValue("number");
                    case ValueType::String: return YawnValue("string");
                    case ValueType::Array: return YawnValue("object");
                    case ValueType::Object: return YawnValue("object");
                    case ValueType::Function: return YawnValue("function");
                }
                return YawnValue("undefined");
            }
            default:
                return YawnValue();
        }
    }

private:
    Env env_;

    YawnValue eval_binary(const ASTNodePtr& node) {
        if (node->op == "||") {
            auto l = evaluate(node->left);
            if (l.is_truthy()) return l;
            return evaluate(node->right);
        }
        if (node->op == "&&") {
            auto l = evaluate(node->left);
            if (!l.is_truthy()) return l;
            return evaluate(node->right);
        }

        auto l = evaluate(node->left);
        auto r = evaluate(node->right);

        if (node->op == "+") {
            if (l.type == ValueType::String || r.type == ValueType::String) {
                return YawnValue(l.to_string() + r.to_string());
            }
            return YawnValue(l.num_val + r.num_val);
        }
        if (node->op == "-") return YawnValue(l.num_val - r.num_val);
        if (node->op == "*") return YawnValue(l.num_val * r.num_val);
        if (node->op == "/") return YawnValue(r.num_val == 0.0 ? 0.0 : l.num_val / r.num_val);
        if (node->op == "%") return YawnValue(r.num_val == 0.0 ? 0.0 : (double)((long long)l.num_val % (long long)r.num_val));

        if (node->op == "==" || node->op == "===") {
            if (l.type != r.type) return YawnValue(false);
            if (l.type == ValueType::String) return YawnValue(l.str_val == r.str_val);
            if (l.type == ValueType::Number) return YawnValue(l.num_val == r.num_val);
            if (l.type == ValueType::Bool) return YawnValue(l.bool_val == r.bool_val);
            if (l.type == ValueType::Null) return YawnValue(true);
            return YawnValue(false);
        }
        if (node->op == "!=" || node->op == "!==") {
            if (l.type != r.type) return YawnValue(true);
            if (l.type == ValueType::String) return YawnValue(l.str_val != r.str_val);
            if (l.type == ValueType::Number) return YawnValue(l.num_val != r.num_val);
            if (l.type == ValueType::Bool) return YawnValue(l.bool_val != r.bool_val);
            if (l.type == ValueType::Null) return YawnValue(false);
            return YawnValue(true);
        }

        if (node->op == "<") return YawnValue(l.num_val < r.num_val);
        if (node->op == ">") return YawnValue(l.num_val > r.num_val);
        if (node->op == "<=") return YawnValue(l.num_val <= r.num_val);
        if (node->op == ">=") return YawnValue(l.num_val >= r.num_val);

        return YawnValue();
    }

    YawnValue eval_unary(const ASTNodePtr& node) {
        auto val = evaluate(node->operand);
        if (node->op == "!") return YawnValue(!val.is_truthy());
        if (node->op == "-") return YawnValue(-val.num_val);
        return YawnValue();
    }

    YawnValue eval_member(const ASTNodePtr& node) {
        auto obj = evaluate(node->object);
        std::string prop;
        if (node->computed_member) {
            prop = evaluate(node->property).to_string();
        } else {
            prop = node->property->str_value;
        }

        if (obj.type == ValueType::Object) {
            auto it = obj.obj_val.find(prop);
            if (it != obj.obj_val.end()) return it->second;
        } else if (obj.type == ValueType::Array) {
            if (prop == "length") return YawnValue((double)obj.arr_val.size());
            try {
                size_t idx = std::stoull(prop);
                if (idx < obj.arr_val.size()) return obj.arr_val[idx];
            } catch (...) {}
        } else if (obj.type == ValueType::String) {
            if (prop == "length") return YawnValue((double)obj.str_val.size());
        }
        return YawnValue();
    }

    YawnValue eval_call(const ASTNodePtr& node) {
        if (node->callee->type == NodeType::MemberExpr) {
            auto obj = evaluate(node->callee->object);
            std::string method = node->callee->property->str_value;

            std::vector<YawnValue> args;
            for (const auto& arg : node->arguments) args.push_back(evaluate(arg));

            if (obj.type == ValueType::String) {
                if (method == "toUpperCase" && args.empty()) {
                    std::string copy = obj.str_val;
                    std::transform(copy.begin(), copy.end(), copy.begin(), ::toupper);
                    return YawnValue(copy);
                }
                if (method == "toLowerCase" && args.empty()) {
                    std::string copy = obj.str_val;
                    std::transform(copy.begin(), copy.end(), copy.begin(), ::tolower);
                    return YawnValue(copy);
                }
                if (method == "includes" && !args.empty()) {
                    return YawnValue(obj.str_val.find(args[0].to_string()) != std::string::npos);
                }
            } else if (obj.type == ValueType::Array) {
                if (method == "join") {
                    std::string sep = args.empty() ? "," : args[0].to_string();
                    std::string res;
                    for (size_t i = 0; i < obj.arr_val.size(); i++) {
                        if (i > 0) res += sep;
                        res += obj.arr_val[i].to_string();
                    }
                    return YawnValue(res);
                }
            }
        }
        return YawnValue();
    }
};

} // namespace yawnc
