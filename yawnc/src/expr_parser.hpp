#pragma once
/**
 * yawnc — Expression Parser (AST)
 *
 * Recursive descent parser that converts a token stream into an AST.
 * Supports: arithmetic, comparison, logical, ternary, member access,
 * function calls, array/object literals, template literals, spread.
 *
 * Operator Precedence (low → high):
 *   Ternary  →  ||  →  &&  →  Equality  →  Comparison  →  Add/Sub  →  Mul/Div  →  Unary  →  Call/Member
 */

#include <string>
#include <vector>
#include <memory>
#include <variant>
#include <stdexcept>
#include "expr_lexer.hpp"

namespace yawnc {

// ─── AST Node Types ──────────────────────────────────────────────────────────

enum class NodeType {
    NumberLiteral,
    StringLiteral,
    BoolLiteral,
    NullLiteral,
    ArrayLiteral,
    ObjectLiteral,
    TemplateLiteral,
    Identifier,
    BinaryExpr,
    UnaryExpr,
    TernaryExpr,
    MemberExpr,
    CallExpr,
    AssignExpr,
    SpreadExpr,
    ArrowFunc,
    TypeofExpr,
};

// ─── AST Node ────────────────────────────────────────────────────────────────

struct ASTNode;
using ASTNodePtr = std::shared_ptr<ASTNode>;

struct ObjProperty {
    std::string key;
    ASTNodePtr  value;
    bool        computed = false;   // { [expr]: value }
    bool        shorthand = false;  // { x } == { x: x }
};

struct ASTNode {
    NodeType type;

    // NumberLiteral
    double num_value = 0;

    // StringLiteral, TemplateLiteral, Identifier
    std::string str_value;

    // BoolLiteral
    bool bool_value = false;

    // BinaryExpr, AssignExpr
    std::string op;
    ASTNodePtr  left;
    ASTNodePtr  right;

    // UnaryExpr
    ASTNodePtr operand;

    // TernaryExpr
    ASTNodePtr condition;
    ASTNodePtr consequent;
    ASTNodePtr alternate;

    // MemberExpr
    ASTNodePtr object;
    ASTNodePtr property;
    bool       computed_member = false;  // a[b] vs a.b

    // CallExpr
    ASTNodePtr              callee;
    std::vector<ASTNodePtr> arguments;

    // ArrayLiteral
    std::vector<ASTNodePtr> elements;

    // ObjectLiteral
    std::vector<ObjProperty> properties;

    // ArrowFunc
    std::vector<std::string> params;
    ASTNodePtr               body;

    // SpreadExpr
    ASTNodePtr spread_arg;

    // TypeofExpr
    ASTNodePtr typeof_arg;

    // TemplateLiteral parts (alternating strings and expressions)
    std::vector<ASTNodePtr> tpl_parts;

    // Factory methods
    static ASTNodePtr Number(double v) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::NumberLiteral;
        n->num_value = v;
        return n;
    }
    static ASTNodePtr String(const std::string& v) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::StringLiteral;
        n->str_value = v;
        return n;
    }
    static ASTNodePtr Bool(bool v) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::BoolLiteral;
        n->bool_value = v;
        return n;
    }
    static ASTNodePtr Null() {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::NullLiteral;
        return n;
    }
    static ASTNodePtr Ident(const std::string& name) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::Identifier;
        n->str_value = name;
        return n;
    }
    static ASTNodePtr Binary(const std::string& op, ASTNodePtr l, ASTNodePtr r) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::BinaryExpr;
        n->op = op;
        n->left = std::move(l);
        n->right = std::move(r);
        return n;
    }
    static ASTNodePtr Unary(const std::string& op, ASTNodePtr operand) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::UnaryExpr;
        n->op = op;
        n->operand = std::move(operand);
        return n;
    }
    static ASTNodePtr Ternary(ASTNodePtr cond, ASTNodePtr cons, ASTNodePtr alt) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::TernaryExpr;
        n->condition = std::move(cond);
        n->consequent = std::move(cons);
        n->alternate = std::move(alt);
        return n;
    }
    static ASTNodePtr Member(ASTNodePtr obj, ASTNodePtr prop, bool computed) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::MemberExpr;
        n->object = std::move(obj);
        n->property = std::move(prop);
        n->computed_member = computed;
        return n;
    }
    static ASTNodePtr Call(ASTNodePtr callee, std::vector<ASTNodePtr> args) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::CallExpr;
        n->callee = std::move(callee);
        n->arguments = std::move(args);
        return n;
    }
    static ASTNodePtr Array(std::vector<ASTNodePtr> elems) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::ArrayLiteral;
        n->elements = std::move(elems);
        return n;
    }
    static ASTNodePtr Object(std::vector<ObjProperty> props) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::ObjectLiteral;
        n->properties = std::move(props);
        return n;
    }
    static ASTNodePtr Assign(const std::string& op, ASTNodePtr l, ASTNodePtr r) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::AssignExpr;
        n->op = op;
        n->left = std::move(l);
        n->right = std::move(r);
        return n;
    }
    static ASTNodePtr Typeof(ASTNodePtr arg) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::TypeofExpr;
        n->typeof_arg = std::move(arg);
        return n;
    }
    static ASTNodePtr TemplLit(std::vector<ASTNodePtr> parts) {
        auto n = std::make_shared<ASTNode>();
        n->type = NodeType::TemplateLiteral;
        n->tpl_parts = std::move(parts);
        return n;
    }
};

// ─── Parser ──────────────────────────────────────────────────────────────────

class ExprParser {
public:
    explicit ExprParser(const std::vector<Token>& tokens) : tokens_(tokens), pos_(0) {}

    ASTNodePtr parse() {
        auto node = parse_expression();
        return node;
    }

    // Parse a comma-separated sequence of expressions (for statement parsing)
    std::vector<ASTNodePtr> parse_expression_list() {
        std::vector<ASTNodePtr> list;
        list.push_back(parse_expression());
        while (match(TokenType::Comma)) {
            list.push_back(parse_expression());
        }
        return list;
    }

private:
    std::vector<Token> tokens_;
    size_t pos_;

    const Token& current() const {
        return (pos_ < tokens_.size()) ? tokens_[pos_] : tokens_.back();
    }

    const Token& peek_at(size_t offset = 0) const {
        size_t idx = pos_ + offset;
        return (idx < tokens_.size()) ? tokens_[idx] : tokens_.back();
    }

    Token advance() {
        Token t = current();
        if (pos_ < tokens_.size()) pos_++;
        return t;
    }

    bool check(TokenType type) const {
        return current().type == type;
    }

    bool match(TokenType type) {
        if (check(type)) { advance(); return true; }
        return false;
    }

    Token expect(TokenType type) {
        if (check(type)) return advance();
        throw std::runtime_error("Expected " + std::string(token_type_name(type)) +
                                 " but got " + std::string(token_type_name(current().type)) +
                                 " '" + current().value + "'");
    }

    // ─── Precedence levels ───────────────────────────────────────────────────

    // Expression: assignment or ternary
    ASTNodePtr parse_expression() {
        auto left = parse_ternary();

        // Assignment: x = expr, x += expr, x -= expr
        if (check(TokenType::Eq) || check(TokenType::PlusEq) || check(TokenType::MinusEq)) {
            std::string op = advance().value;
            auto right = parse_expression();
            return ASTNode::Assign(op, left, right);
        }
        return left;
    }

    // Ternary: expr ? expr : expr
    ASTNodePtr parse_ternary() {
        auto cond = parse_or();
        if (match(TokenType::Question)) {
            auto consequent = parse_expression();
            expect(TokenType::Colon);
            auto alternate = parse_expression();
            return ASTNode::Ternary(cond, consequent, alternate);
        }
        return cond;
    }

    // Logical OR: a || b
    ASTNodePtr parse_or() {
        auto left = parse_and();
        while (match(TokenType::Or)) {
            auto right = parse_and();
            left = ASTNode::Binary("||", left, right);
        }
        return left;
    }

    // Logical AND: a && b
    ASTNodePtr parse_and() {
        auto left = parse_equality();
        while (match(TokenType::And)) {
            auto right = parse_equality();
            left = ASTNode::Binary("&&", left, right);
        }
        return left;
    }

    // Equality: ==, !=, ===, !==
    ASTNodePtr parse_equality() {
        auto left = parse_comparison();
        while (check(TokenType::EqEq) || check(TokenType::NotEq) ||
               check(TokenType::EqEqEq) || check(TokenType::NotEqEq)) {
            std::string op = advance().value;
            auto right = parse_comparison();
            left = ASTNode::Binary(op, left, right);
        }
        return left;
    }

    // Comparison: <, >, <=, >=
    ASTNodePtr parse_comparison() {
        auto left = parse_addition();
        while (check(TokenType::Lt) || check(TokenType::Gt) ||
               check(TokenType::LtEq) || check(TokenType::GtEq)) {
            std::string op = advance().value;
            auto right = parse_addition();
            left = ASTNode::Binary(op, left, right);
        }
        return left;
    }

    // Addition: +, -
    ASTNodePtr parse_addition() {
        auto left = parse_multiplication();
        while (check(TokenType::Plus) || check(TokenType::Minus)) {
            std::string op = advance().value;
            auto right = parse_multiplication();
            left = ASTNode::Binary(op, left, right);
        }
        return left;
    }

    // Multiplication: *, /, %
    ASTNodePtr parse_multiplication() {
        auto left = parse_unary();
        while (check(TokenType::Star) || check(TokenType::Slash) || check(TokenType::Percent)) {
            std::string op = advance().value;
            auto right = parse_unary();
            left = ASTNode::Binary(op, left, right);
        }
        return left;
    }

    // Unary: !, -, typeof
    ASTNodePtr parse_unary() {
        if (match(TokenType::Not)) {
            return ASTNode::Unary("!", parse_unary());
        }
        if (check(TokenType::Minus)) {
            // Check if it's unary minus (not subtraction)
            advance();
            return ASTNode::Unary("-", parse_unary());
        }
        if (match(TokenType::Typeof)) {
            return ASTNode::Typeof(parse_unary());
        }
        return parse_call_member();
    }

    // Call / Member access: a.b, a[b], a(b,c)
    ASTNodePtr parse_call_member() {
        auto expr = parse_primary();

        while (true) {
            if (match(TokenType::Dot)) {
                // a.b
                Token prop = expect(TokenType::Identifier);
                expr = ASTNode::Member(expr, ASTNode::String(prop.value), false);
            } else if (match(TokenType::LBracket)) {
                // a[expr]
                auto index = parse_expression();
                expect(TokenType::RBracket);
                expr = ASTNode::Member(expr, index, true);
            } else if (match(TokenType::LParen)) {
                // a(args)
                std::vector<ASTNodePtr> args;
                if (!check(TokenType::RParen)) {
                    do {
                        if (check(TokenType::Spread)) {
                            advance();
                            auto arg = parse_expression();
                            auto spread = std::make_shared<ASTNode>();
                            spread->type = NodeType::SpreadExpr;
                            spread->spread_arg = arg;
                            args.push_back(spread);
                        } else {
                            args.push_back(parse_expression());
                        }
                    } while (match(TokenType::Comma));
                }
                expect(TokenType::RParen);
                expr = ASTNode::Call(expr, std::move(args));
            } else {
                break;
            }
        }
        return expr;
    }

    // Primary: literals, identifiers, grouped expressions
    ASTNodePtr parse_primary() {
        // Number
        if (check(TokenType::Number)) {
            Token t = advance();
            return ASTNode::Number(std::stod(t.value));
        }

        // String
        if (check(TokenType::String)) {
            Token t = advance();
            return ASTNode::String(t.value);
        }

        // Template literal
        if (check(TokenType::TemplateLiteral)) {
            return parse_template_literal();
        }

        // Boolean
        if (check(TokenType::True))  { advance(); return ASTNode::Bool(true); }
        if (check(TokenType::False)) { advance(); return ASTNode::Bool(false); }

        // Null / Undefined
        if (check(TokenType::Null) || check(TokenType::Undefined)) {
            advance();
            return ASTNode::Null();
        }

        // Identifier
        if (check(TokenType::Identifier)) {
            Token t = advance();
            // Check for arrow function: (params) => body  or  param => body
            if (check(TokenType::Arrow)) {
                advance(); // skip =>
                auto body = parse_expression();
                auto arrow = std::make_shared<ASTNode>();
                arrow->type = NodeType::ArrowFunc;
                arrow->params.push_back(t.value);
                arrow->body = body;
                return arrow;
            }
            return ASTNode::Ident(t.value);
        }

        // Grouped expression or arrow function params
        if (check(TokenType::LParen)) {
            advance();
            // Check for arrow function: () => body or (a, b) => body
            if (check(TokenType::RParen)) {
                advance();
                if (check(TokenType::Arrow)) {
                    advance();
                    auto body = parse_expression();
                    auto arrow = std::make_shared<ASTNode>();
                    arrow->type = NodeType::ArrowFunc;
                    arrow->body = body;
                    return arrow;
                }
                // Empty parens — return null
                return ASTNode::Null();
            }

            // Try to detect (a, b) => body
            // Save position for backtracking
            size_t saved = pos_;
            bool is_arrow = false;
            std::vector<std::string> params;

            if (check(TokenType::Identifier)) {
                params.push_back(current().value);
                advance();
                while (match(TokenType::Comma)) {
                    if (check(TokenType::Identifier)) {
                        params.push_back(current().value);
                        advance();
                    } else {
                        break;
                    }
                }
                if (match(TokenType::RParen) && check(TokenType::Arrow)) {
                    is_arrow = true;
                }
            }

            if (is_arrow) {
                advance(); // skip =>
                auto body = parse_expression();
                auto arrow = std::make_shared<ASTNode>();
                arrow->type = NodeType::ArrowFunc;
                arrow->params = std::move(params);
                arrow->body = body;
                return arrow;
            }

            // Backtrack and parse as grouped expression
            pos_ = saved;
            auto expr = parse_expression();
            expect(TokenType::RParen);
            return expr;
        }

        // Array literal: [a, b, c]
        if (check(TokenType::LBracket)) {
            return parse_array_literal();
        }

        // Object literal: { key: value }
        if (check(TokenType::LBrace)) {
            return parse_object_literal();
        }

        // If nothing matches, return null
        advance(); // skip unknown token
        return ASTNode::Null();
    }

    // ─── Compound parsers ────────────────────────────────────────────────────

    ASTNodePtr parse_array_literal() {
        expect(TokenType::LBracket);
        std::vector<ASTNodePtr> elements;
        while (!check(TokenType::RBracket) && !check(TokenType::Eof)) {
            if (check(TokenType::Spread)) {
                advance();
                auto arg = parse_expression();
                auto spread = std::make_shared<ASTNode>();
                spread->type = NodeType::SpreadExpr;
                spread->spread_arg = arg;
                elements.push_back(spread);
            } else {
                elements.push_back(parse_expression());
            }
            if (!match(TokenType::Comma)) break;
        }
        expect(TokenType::RBracket);
        return ASTNode::Array(std::move(elements));
    }

    ASTNodePtr parse_object_literal() {
        expect(TokenType::LBrace);
        std::vector<ObjProperty> props;
        while (!check(TokenType::RBrace) && !check(TokenType::Eof)) {
            ObjProperty prop;

            if (check(TokenType::Spread)) {
                // Spread in object: { ...other }
                advance();
                auto arg = parse_expression();
                prop.key = "...";
                prop.value = arg;
                props.push_back(prop);
            } else if (check(TokenType::LBracket)) {
                // Computed key: { [expr]: value }
                advance();
                auto key_expr = parse_expression();
                expect(TokenType::RBracket);
                expect(TokenType::Colon);
                prop.computed = true;
                prop.key = "";
                prop.value = parse_expression();
                props.push_back(prop);
            } else {
                // Normal key: identifier or string
                std::string key;
                if (check(TokenType::Identifier)) {
                    key = advance().value;
                } else if (check(TokenType::String)) {
                    key = advance().value;
                } else if (check(TokenType::Number)) {
                    key = advance().value;
                } else {
                    // Skip unexpected token
                    advance();
                    if (!match(TokenType::Comma)) break;
                    continue;
                }

                prop.key = key;
                if (match(TokenType::Colon)) {
                    prop.value = parse_expression();
                } else {
                    // Shorthand: { x } means { x: x }
                    prop.shorthand = true;
                    prop.value = ASTNode::Ident(key);
                }
                props.push_back(prop);
            }
            if (!match(TokenType::Comma)) break;
        }
        expect(TokenType::RBrace);
        return ASTNode::Object(std::move(props));
    }

    ASTNodePtr parse_template_literal() {
        Token t = advance();
        const std::string& raw = t.value;
        std::vector<ASTNodePtr> parts;
        std::string current_str;
        size_t i = 0;

        while (i < raw.size()) {
            if (raw[i] == '$' && i + 1 < raw.size() && raw[i + 1] == '{') {
                // Push accumulated string
                if (!current_str.empty()) {
                    parts.push_back(ASTNode::String(current_str));
                    current_str.clear();
                }
                // Find matching }
                i += 2;
                std::string expr_str;
                int depth = 1;
                while (i < raw.size() && depth > 0) {
                    if (raw[i] == '{') depth++;
                    if (raw[i] == '}') { depth--; if (depth == 0) break; }
                    expr_str += raw[i];
                    i++;
                }
                if (i < raw.size()) i++; // skip closing }
                // Parse the inner expression
                ExprLexer lexer(expr_str);
                ExprParser parser(lexer.tokenize());
                parts.push_back(parser.parse());
            } else {
                current_str += raw[i++];
            }
        }
        if (!current_str.empty()) {
            parts.push_back(ASTNode::String(current_str));
        }
        return ASTNode::TemplLit(std::move(parts));
    }
};

// ─── Convenience: parse an expression string ─────────────────────────────────

inline ASTNodePtr parse_expr(const std::string& source) {
    ExprLexer lexer(source);
    ExprParser parser(lexer.tokenize());
    return parser.parse();
}

} // namespace yawnc
