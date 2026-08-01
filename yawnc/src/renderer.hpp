#pragma once
#include <string>
#include <map>
#include <vector>
#include <sstream>
#include <regex>
#include <functional>
#include <algorithm>
#include "utils.hpp"
#include "expr_eval.hpp"

namespace yawnc {

class Renderer {
public:
    Env state;
    std::function<std::optional<std::string>(const std::string&)> resolve_component;

    explicit Renderer(Env s) : state(std::move(s)) {}

    std::string render(const std::string& tpl) {
        std::string h = tpl;
        h = process_events(h);
        h = process_model(h);
        h = process_each(h);
        h = process_if_else(h);
        h = process_bind_attr(h);
        h = process_class(h);
        h = process_style(h);
        h = process_interpolation(h);
        h = strip_directives(h);
        return h;
    }

private:
    std::string process_events(const std::string& h) {
        std::string out = h;
        std::regex re(R"( @([\w:]+)="([^"]*)")");
        return rebuild(h, re, [](const std::smatch& m) {
            return " data-yawnc-on-" + m[1].str() + "=\"" + m[2].str() + "\"";
        });
    }

    std::string process_model(const std::string& h) {
        return rebuild(h, std::regex(R"( :model="(\w+)")"), [&](const std::smatch& m) {
            auto it = state.find(m[1].str());
            std::string val = (it != state.end()) ? utils::escape_html(it->second.to_string()) : "";
            return " data-yawnc-on-input=\"" + m[1].str() + "=event.target.value\""
                   " data-yawnc-model=\"" + m[1].str() + "\""
                   " value=\"" + val + "\"";
        });
    }

    std::string process_each(const std::string& h) {
        std::regex each_re(R"( :each="(\w+)(?:,\s*(\w+))?\s+in\s+([^"]+)")");
        std::string result;
        size_t pos = 0;
        while (pos < h.size()) {
            size_t ts = h.find('<', pos);
            if (ts == std::string::npos) { result += h.substr(pos); break; }
            size_t te = h.find('>', ts);
            if (te == std::string::npos) { result += h.substr(pos); break; }
            std::string head = h.substr(ts, te - ts + 1);
            std::smatch em;
            if (!std::regex_search(head, em, each_re)) { result += h.substr(pos, te - pos + 1); pos = te + 1; continue; }

            std::string item_var = em[1].str();
            std::string idx_var  = em[2].str();
            std::string list_expr = em[3].str();

            std::smatch tnm;
            std::regex tn_re(R"(^<([\w-]+))");
            if (!std::regex_search(head, tnm, tn_re)) { result += h.substr(pos, te - pos + 1); pos = te + 1; continue; }
            std::string tn = tnm[1].str();

            if (head.back() == '/' || head[head.size()-2] == '/') { result += h.substr(pos, ts - pos); pos = te + 1; continue; }

            result += h.substr(pos, ts - pos);
            auto blk = find_close(h, te + 1, tn);
            if (!blk.found) { result += h.substr(ts, te - ts + 1); pos = te + 1; continue; }

            std::string inner = blk.inner;
            std::string attrs = std::regex_replace(head, each_re, "");
            attrs = std::regex_replace(attrs, std::regex("^<[\\w-]+"), "");
            attrs = std::regex_replace(attrs, std::regex(">$"), "");
            attrs = utils::trim(attrs);

            std::vector<YawnValue> items;
            ExprLexer lexer(list_expr);
            ExprParser parser(lexer.tokenize());
            auto list_val = ExprEvaluator(state).evaluate(parser.parse());
            if (list_val.type == ValueType::Array) {
                items = list_val.arr_val;
            }

            for (size_t i = 0; i < items.size(); i++) {
                Env item_state = state;
                item_state[item_var] = items[i];
                item_state["$index"] = YawnValue((double)i);
                if (!idx_var.empty()) item_state[idx_var] = YawnValue((double)i);
                Renderer sub(item_state);
                sub.resolve_component = resolve_component;
                result += "<" + tn + (attrs.empty() ? "" : " " + attrs) + ">"
                       + sub.render(inner) + "</" + tn + ">";
            }
            pos = blk.end_pos;
        }
        return result;
    }

    std::string process_if_else(const std::string& h) {
        std::regex if_re(R"( :if="([^"]+)")");
        std::string result;
        size_t pos = 0;
        while (pos < h.size()) {
            size_t ts = h.find('<', pos);
            if (ts == std::string::npos) { result += h.substr(pos); break; }
            size_t te = h.find('>', ts);
            if (te == std::string::npos) { result += h.substr(pos); break; }
            std::string head = h.substr(ts, te - ts + 1);
            std::smatch im;
            if (!std::regex_search(head, im, if_re)) { result += h.substr(pos, te - pos + 1); pos = te + 1; continue; }
            std::string expr = im[1].str();
            std::smatch tnm; std::regex tn_re(R"(^<([\w-]+))");
            if (!std::regex_search(head, tnm, tn_re)) { result += h.substr(pos, te - pos + 1); pos = te + 1; continue; }
            std::string tn = tnm[1].str();
            result += h.substr(pos, ts - pos);
            auto blk = find_close(h, te + 1, tn);
            if (!blk.found) { result += h.substr(ts, te - ts + 1); pos = te + 1; continue; }
            std::string inner = blk.inner;
            std::string attrs = std::regex_replace(head, if_re, "");
            attrs = std::regex_replace(attrs, std::regex("^<[\\w-]+"), "");
            attrs = std::regex_replace(attrs, std::regex(">$"), "");
            attrs = utils::trim(attrs);

            ExprLexer lexer(expr);
            ExprParser parser(lexer.tokenize());
            bool show = ExprEvaluator(state).evaluate(parser.parse()).is_truthy();

            size_t after = blk.end_pos;
            std::regex else_re(R"(^(\s*)<([\w-]*)([^>]*?) :else([^>]*)>([\s\S]*?)<\/\2>)");
            std::string rest = h.substr(after);
            std::smatch elsem;
            if (std::regex_search(rest, elsem, else_re, std::regex_constants::match_continuous)) {
                if (show) {
                    Renderer sub(state); sub.resolve_component = resolve_component;
                    result += "<" + tn + (attrs.empty()?"" : " "+attrs) + ">" + sub.render(inner) + "</" + tn + ">";
                } else {
                    std::string etn   = elsem[2].str();
                    std::string eatts = std::regex_replace(elsem[3].str() + elsem[4].str(), std::regex(R"( :else\b)"), "");
                    Renderer sub(state); sub.resolve_component = resolve_component;
                    result += "<" + etn + eatts + ">" + sub.render(elsem[5].str()) + "</" + etn + ">";
                }
                pos = after + elsem[0].length();
            } else {
                if (show) {
                    Renderer sub(state); sub.resolve_component = resolve_component;
                    result += "<" + tn + (attrs.empty()?"" : " "+attrs) + ">" + sub.render(inner) + "</" + tn + ">";
                }
                pos = after;
            }
        }
        return result;
    }

    std::string process_bind_attr(const std::string& h) {
        return rebuild(h, std::regex(R"( :bind:([\w-]+)="([^"]+)")"), [&](const std::smatch& m) {
            ExprLexer lexer(m[2].str());
            ExprParser parser(lexer.tokenize());
            std::string val = ExprEvaluator(state).evaluate(parser.parse()).to_string();
            if (val.empty()) return std::string("");
            return " " + m[1].str() + "=\"" + utils::escape_html(val) + "\"";
        });
    }

    std::string process_class(const std::string& h) {
        return rebuild(h, std::regex(R"( :class="([^"]+)")"), [&](const std::smatch& m) {
            ExprLexer lexer(m[1].str());
            ExprParser parser(lexer.tokenize());
            auto val = ExprEvaluator(state).evaluate(parser.parse());
            std::string class_str;
            if (val.type == ValueType::Object) {
                for (const auto& [k, v] : val.obj_val) {
                    if (v.is_truthy()) {
                        if (!class_str.empty()) class_str += " ";
                        class_str += k;
                    }
                }
            } else if (val.type == ValueType::Array) {
                for (const auto& el : val.arr_val) {
                    if (!class_str.empty()) class_str += " ";
                    class_str += el.to_string();
                }
            } else {
                class_str = val.to_string();
            }
            if (class_str.empty()) return std::string("");
            return " class=\"" + utils::escape_html(class_str) + "\"";
        });
    }

    std::string process_style(const std::string& h) {
        return rebuild(h, std::regex(R"( :style="([^"]+)")"), [&](const std::smatch& m) {
            ExprLexer lexer(m[1].str());
            ExprParser parser(lexer.tokenize());
            auto val = ExprEvaluator(state).evaluate(parser.parse());
            std::string style_str;
            if (val.type == ValueType::Object) {
                for (const auto& [k, v] : val.obj_val) {
                    if (!style_str.empty()) style_str += ";";
                    style_str += k + ":" + v.to_string();
                }
            } else {
                style_str = val.to_string();
            }
            if (style_str.empty()) return std::string("");
            return " style=\"" + utils::escape_html(style_str) + "\"";
        });
    }

    std::string process_interpolation(const std::string& h) {
        return rebuild(h, std::regex(R"(\{\{([^}]+)\}\})"), [&](const std::smatch& m) {
            ExprLexer lexer(m[1].str());
            ExprParser parser(lexer.tokenize());
            auto val = ExprEvaluator(state).evaluate(parser.parse());
            return utils::escape_html(val.to_string());
        });
    }

    std::string strip_directives(const std::string& h) {
        std::string out = h;
        out = std::regex_replace(out, std::regex(R"( @[\w:]+="[^"]*")"), "");
        out = std::regex_replace(out, std::regex(R"( :(?:if|else|each|bind:[\w-]+|class|style|model)(?:="[^"]*")?)"), "");
        return out;
    }

    std::string rebuild(const std::string& h, const std::regex& re,
                        std::function<std::string(const std::smatch&)> fn) {
        std::string out;
        std::sregex_iterator it(h.begin(), h.end(), re), end;
        size_t pos = 0;
        for (; it != end; ++it) {
            out += h.substr(pos, it->position() - pos);
            out += fn(*it);
            pos = it->position() + it->length();
        }
        out += h.substr(pos);
        return out;
    }

    struct Block { std::string inner; size_t end_pos; bool found; };

    Block find_close(const std::string& h, size_t start, const std::string& tag) {
        std::string open  = "<" + tag;
        std::string close = "</" + tag + ">";
        int depth = 1;
        size_t pos = start;
        while (pos < h.size() && depth > 0) {
            size_t no = h.find(open,  pos);
            size_t nc = h.find(close, pos);
            if (nc == std::string::npos) return {"", 0, false};
            if (no != std::string::npos && no < nc) { depth++; pos = no + 1; }
            else { depth--; if (depth == 0) return {h.substr(start, nc - start), nc + close.size(), true}; else pos = nc + 1; }
        }
        return {"", 0, false};
    }
};

} // namespace yawnc
