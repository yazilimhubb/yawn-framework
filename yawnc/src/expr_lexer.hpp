#pragma once
/**
 * yawnc — Expression Lexer (Tokenizer)
 *
 * Converts expression strings into a sequence of tokens for the parser.
 * Supports: numbers, strings, booleans, identifiers, operators, dot/bracket
 * access, ternary, template literals, and more.
 */

#include <string>
#include <vector>
#include <stdexcept>
#include <cctype>

namespace yawnc {

// ─── Token Types ─────────────────────────────────────────────────────────────

enum class TokenType {
    // Literals
    Number,           // 42, 3.14, -7
    String,           // "hello", 'world'
    TemplateLiteral,  // `hello ${name}`
    True,             // true
    False,            // false
    Null,             // null
    Undefined,        // undefined

    // Identifier
    Identifier,       // count, userName, $index

    // Arithmetic
    Plus,             // +
    Minus,            // -
    Star,             // *
    Slash,            // /
    Percent,          // %

    // Comparison
    EqEq,             // ==
    EqEqEq,           // ===
    NotEq,            // !=
    NotEqEq,          // !==
    Lt,               // <
    Gt,               // >
    LtEq,             // <=
    GtEq,             // >=

    // Logical
    And,              // &&
    Or,               // ||
    Not,              // !

    // Assignment
    Eq,               // =
    PlusEq,           // +=
    MinusEq,          // -=

    // Delimiters
    LParen,           // (
    RParen,           // )
    LBracket,         // [
    RBracket,         // ]
    LBrace,           // {
    RBrace,           // }
    Dot,              // .
    Comma,            // ,
    Semicolon,        // ;
    Colon,            // :
    Question,         // ?
    Arrow,            // =>
    Spread,           // ...

    // Special
    Typeof,           // typeof
    New,              // new
    In,               // in

    // End
    Eof,
};

inline const char* token_type_name(TokenType t) {
    switch (t) {
        case TokenType::Number:          return "Number";
        case TokenType::String:          return "String";
        case TokenType::TemplateLiteral: return "TemplateLiteral";
        case TokenType::True:            return "true";
        case TokenType::False:           return "false";
        case TokenType::Null:            return "null";
        case TokenType::Undefined:       return "undefined";
        case TokenType::Identifier:      return "Identifier";
        case TokenType::Plus:            return "+";
        case TokenType::Minus:           return "-";
        case TokenType::Star:            return "*";
        case TokenType::Slash:           return "/";
        case TokenType::Percent:         return "%";
        case TokenType::EqEq:            return "==";
        case TokenType::EqEqEq:          return "===";
        case TokenType::NotEq:           return "!=";
        case TokenType::NotEqEq:         return "!==";
        case TokenType::Lt:              return "<";
        case TokenType::Gt:              return ">";
        case TokenType::LtEq:            return "<=";
        case TokenType::GtEq:            return ">=";
        case TokenType::And:             return "&&";
        case TokenType::Or:              return "||";
        case TokenType::Not:             return "!";
        case TokenType::Eq:              return "=";
        case TokenType::PlusEq:          return "+=";
        case TokenType::MinusEq:         return "-=";
        case TokenType::LParen:          return "(";
        case TokenType::RParen:          return ")";
        case TokenType::LBracket:        return "[";
        case TokenType::RBracket:        return "]";
        case TokenType::LBrace:          return "{";
        case TokenType::RBrace:          return "}";
        case TokenType::Dot:             return ".";
        case TokenType::Comma:           return ",";
        case TokenType::Semicolon:       return ";";
        case TokenType::Colon:           return ":";
        case TokenType::Question:        return "?";
        case TokenType::Arrow:           return "=>";
        case TokenType::Spread:          return "...";
        case TokenType::Typeof:          return "typeof";
        case TokenType::New:             return "new";
        case TokenType::In:              return "in";
        case TokenType::Eof:             return "EOF";
    }
    return "?";
}

// ─── Token ───────────────────────────────────────────────────────────────────

struct Token {
    TokenType   type;
    std::string value;
    int         pos = 0;  // position in source string

    Token() : type(TokenType::Eof) {}
    Token(TokenType t, const std::string& v, int p = 0) : type(t), value(v), pos(p) {}
};

// ─── Lexer ───────────────────────────────────────────────────────────────────

class ExprLexer {
public:
    explicit ExprLexer(const std::string& source) : src_(source), pos_(0) {}

    std::vector<Token> tokenize() {
        std::vector<Token> tokens;
        while (pos_ < src_.size()) {
            skip_whitespace();
            if (pos_ >= src_.size()) break;

            char c = src_[pos_];
            int start = (int)pos_;

            // Numbers
            if (std::isdigit(c) || (c == '.' && pos_ + 1 < src_.size() && std::isdigit(src_[pos_ + 1]))) {
                tokens.push_back(read_number());
                continue;
            }

            // Strings
            if (c == '"' || c == '\'') {
                tokens.push_back(read_string(c));
                continue;
            }

            // Template literals
            if (c == '`') {
                tokens.push_back(read_template_literal());
                continue;
            }

            // Identifiers and keywords
            if (std::isalpha(c) || c == '_' || c == '$') {
                tokens.push_back(read_identifier());
                continue;
            }

            // Operators and delimiters
            switch (c) {
                case '+':
                    pos_++;
                    if (peek() == '=') { pos_++; tokens.emplace_back(TokenType::PlusEq, "+=", start); }
                    else if (peek() == '+') { pos_++; tokens.emplace_back(TokenType::PlusEq, "++", start); } // treat ++ as +=1 later
                    else tokens.emplace_back(TokenType::Plus, "+", start);
                    continue;
                case '-':
                    pos_++;
                    if (peek() == '=') { pos_++; tokens.emplace_back(TokenType::MinusEq, "-=", start); }
                    else if (peek() == '-') { pos_++; tokens.emplace_back(TokenType::MinusEq, "--", start); }
                    else if (peek() == '>') { pos_++; tokens.emplace_back(TokenType::Arrow, "->", start); }
                    else tokens.emplace_back(TokenType::Minus, "-", start);
                    continue;
                case '*':
                    pos_++;
                    tokens.emplace_back(TokenType::Star, "*", start);
                    continue;
                case '/':
                    pos_++;
                    tokens.emplace_back(TokenType::Slash, "/", start);
                    continue;
                case '%':
                    pos_++;
                    tokens.emplace_back(TokenType::Percent, "%", start);
                    continue;
                case '=':
                    pos_++;
                    if (peek() == '=') {
                        pos_++;
                        if (peek() == '=') { pos_++; tokens.emplace_back(TokenType::EqEqEq, "===", start); }
                        else tokens.emplace_back(TokenType::EqEq, "==", start);
                    } else if (peek() == '>') {
                        pos_++; tokens.emplace_back(TokenType::Arrow, "=>", start);
                    } else {
                        tokens.emplace_back(TokenType::Eq, "=", start);
                    }
                    continue;
                case '!':
                    pos_++;
                    if (peek() == '=') {
                        pos_++;
                        if (peek() == '=') { pos_++; tokens.emplace_back(TokenType::NotEqEq, "!==", start); }
                        else tokens.emplace_back(TokenType::NotEq, "!=", start);
                    } else {
                        tokens.emplace_back(TokenType::Not, "!", start);
                    }
                    continue;
                case '<':
                    pos_++;
                    if (peek() == '=') { pos_++; tokens.emplace_back(TokenType::LtEq, "<=", start); }
                    else tokens.emplace_back(TokenType::Lt, "<", start);
                    continue;
                case '>':
                    pos_++;
                    if (peek() == '=') { pos_++; tokens.emplace_back(TokenType::GtEq, ">=", start); }
                    else tokens.emplace_back(TokenType::Gt, ">", start);
                    continue;
                case '&':
                    pos_++;
                    if (peek() == '&') { pos_++; tokens.emplace_back(TokenType::And, "&&", start); }
                    continue;
                case '|':
                    pos_++;
                    if (peek() == '|') { pos_++; tokens.emplace_back(TokenType::Or, "||", start); }
                    continue;
                case '(':
                    pos_++; tokens.emplace_back(TokenType::LParen, "(", start); continue;
                case ')':
                    pos_++; tokens.emplace_back(TokenType::RParen, ")", start); continue;
                case '[':
                    pos_++; tokens.emplace_back(TokenType::LBracket, "[", start); continue;
                case ']':
                    pos_++; tokens.emplace_back(TokenType::RBracket, "]", start); continue;
                case '{':
                    pos_++; tokens.emplace_back(TokenType::LBrace, "{", start); continue;
                case '}':
                    pos_++; tokens.emplace_back(TokenType::RBrace, "}", start); continue;
                case '.':
                    pos_++;
                    if (peek() == '.' && pos_ + 1 < src_.size() && src_[pos_ + 1] == '.') {
                        pos_ += 2; tokens.emplace_back(TokenType::Spread, "...", start);
                    } else {
                        tokens.emplace_back(TokenType::Dot, ".", start);
                    }
                    continue;
                case ',':
                    pos_++; tokens.emplace_back(TokenType::Comma, ",", start); continue;
                case ';':
                    pos_++; tokens.emplace_back(TokenType::Semicolon, ";", start); continue;
                case ':':
                    pos_++; tokens.emplace_back(TokenType::Colon, ":", start); continue;
                case '?':
                    pos_++; tokens.emplace_back(TokenType::Question, "?", start); continue;
                default:
                    // Skip unknown characters
                    pos_++;
                    continue;
            }
        }
        tokens.emplace_back(TokenType::Eof, "", (int)pos_);
        return tokens;
    }

private:
    std::string src_;
    size_t      pos_;

    char peek() const {
        return (pos_ < src_.size()) ? src_[pos_] : '\0';
    }

    char advance() {
        return (pos_ < src_.size()) ? src_[pos_++] : '\0';
    }

    void skip_whitespace() {
        while (pos_ < src_.size() && std::isspace(src_[pos_])) pos_++;
    }

    Token read_number() {
        int start = (int)pos_;
        std::string num;

        // Optional leading negative is handled by parser as unary minus
        while (pos_ < src_.size() && (std::isdigit(src_[pos_]) || src_[pos_] == '.')) {
            num += src_[pos_++];
        }
        // Scientific notation: 1e10, 2.5E-3
        if (pos_ < src_.size() && (src_[pos_] == 'e' || src_[pos_] == 'E')) {
            num += src_[pos_++];
            if (pos_ < src_.size() && (src_[pos_] == '+' || src_[pos_] == '-'))
                num += src_[pos_++];
            while (pos_ < src_.size() && std::isdigit(src_[pos_]))
                num += src_[pos_++];
        }
        return {TokenType::Number, num, start};
    }

    Token read_string(char quote) {
        int start = (int)pos_;
        pos_++; // skip opening quote
        std::string str;
        while (pos_ < src_.size() && src_[pos_] != quote) {
            if (src_[pos_] == '\\' && pos_ + 1 < src_.size()) {
                pos_++; // skip backslash
                switch (src_[pos_]) {
                    case 'n':  str += '\n'; break;
                    case 't':  str += '\t'; break;
                    case 'r':  str += '\r'; break;
                    case '\\': str += '\\'; break;
                    case '\'': str += '\''; break;
                    case '"':  str += '"';  break;
                    default:   str += src_[pos_]; break;
                }
                pos_++;
            } else {
                str += src_[pos_++];
            }
        }
        if (pos_ < src_.size()) pos_++; // skip closing quote
        return {TokenType::String, str, start};
    }

    Token read_template_literal() {
        int start = (int)pos_;
        pos_++; // skip opening backtick
        std::string str;
        while (pos_ < src_.size() && src_[pos_] != '`') {
            if (src_[pos_] == '\\' && pos_ + 1 < src_.size()) {
                pos_++;
                str += src_[pos_++];
            } else if (src_[pos_] == '$' && pos_ + 1 < src_.size() && src_[pos_ + 1] == '{') {
                // Keep ${...} as-is for the parser to handle
                str += "${";
                pos_ += 2;
                int depth = 1;
                while (pos_ < src_.size() && depth > 0) {
                    if (src_[pos_] == '{') depth++;
                    if (src_[pos_] == '}') depth--;
                    if (depth > 0) str += src_[pos_];
                    pos_++;
                }
                str += "}";
            } else {
                str += src_[pos_++];
            }
        }
        if (pos_ < src_.size()) pos_++; // skip closing backtick
        return {TokenType::TemplateLiteral, str, start};
    }

    Token read_identifier() {
        int start = (int)pos_;
        std::string id;
        while (pos_ < src_.size() && (std::isalnum(src_[pos_]) || src_[pos_] == '_' || src_[pos_] == '$')) {
            id += src_[pos_++];
        }
        // Keywords
        if (id == "true")      return {TokenType::True, id, start};
        if (id == "false")     return {TokenType::False, id, start};
        if (id == "null")      return {TokenType::Null, id, start};
        if (id == "undefined") return {TokenType::Undefined, id, start};
        if (id == "typeof")    return {TokenType::Typeof, id, start};
        if (id == "new")       return {TokenType::New, id, start};
        if (id == "in")        return {TokenType::In, id, start};
        return {TokenType::Identifier, id, start};
    }
};

} // namespace yawnc
