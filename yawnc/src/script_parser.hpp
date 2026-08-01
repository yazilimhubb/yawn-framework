#pragma once
#include <string>
#include <vector>
#include <regex>
#include "expr_eval.hpp"
#include "utils.hpp"

namespace yawnc {

struct ScriptVar {
    std::string name;
    YawnValue value;
    std::string raw_init;
};

class ScriptParser {
public:
    static std::vector<ScriptVar> parse(const std::string& script) {
        std::vector<ScriptVar> vars;
        if (script.empty()) return vars;

        std::regex decl_re(R"((?:let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;\n]+))");
        auto begin = std::sregex_iterator(script.begin(), script.end(), decl_re);
        auto end = std::sregex_iterator();

        for (auto it = begin; it != end; ++it) {
            std::string name = utils::trim((*it)[1].str());
            std::string init = utils::trim((*it)[2].str());
            if (!init.empty() && init.back() == ';') init.pop_back();
            init = utils::trim(init);

            YawnValue val;
            if (init == "true") val = YawnValue(true);
            else if (init == "false") val = YawnValue(false);
            else if (init == "null" || init == "undefined") val = YawnValue();
            else if ((init.front() == '"' && init.back() == '"') || (init.front() == '\'' && init.back() == '\'')) {
                val = YawnValue(init.substr(1, init.size() - 2));
            } else if (init.front() == '[' && init.back() == ']') {
                std::vector<YawnValue> arr;
                std::string inner = init.substr(1, init.size() - 2);
                for (const auto& s : utils::split(inner, ',')) {
                    std::string item = utils::trim(s);
                    if (item.front() == '"' || item.front() == '\'') item = item.substr(1, item.size() - 2);
                    arr.push_back(YawnValue(item));
                }
                val = YawnValue(arr);
            } else {
                try {
                    val = YawnValue(std::stod(init));
                } catch (...) {
                    val = YawnValue(init);
                }
            }
            vars.push_back({name, val, init});
        }
        return vars;
    }
};

} // namespace yawnc
