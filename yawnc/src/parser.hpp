#pragma once
#include <string>
#include <map>
#include <regex>
#include "utils.hpp"
#include "script_parser.hpp"

namespace yawnc {

struct SFCBlock {
    std::string name;
    std::string tmpl;
    std::string script;
    std::string style;
    std::map<std::string, std::string> meta;
};

inline std::string extract_block(const std::string& source, const std::string& tag) {
    const std::string open  = "<" + tag;
    const std::string close = "</" + tag + ">";

    size_t start = source.find(open);
    if (start == std::string::npos) return "";

    size_t tag_end = source.find('>', start);
    if (tag_end == std::string::npos) return "";

    size_t content_start = tag_end + 1;
    size_t content_end   = source.find(close, content_start);
    if (content_end == std::string::npos) return "";

    return utils::trim(source.substr(content_start, content_end - content_start));
}

inline std::map<std::string, std::string> parse_meta(const std::string& meta_raw) {
    std::map<std::string, std::string> meta;
    if (meta_raw.empty()) return meta;

    for (const auto& line : utils::split(meta_raw, '\n')) {
        auto trimmed = utils::trim(line);
        auto colon   = trimmed.find(':');
        if (colon == std::string::npos) continue;
        auto key   = utils::trim(trimmed.substr(0, colon));
        auto value = utils::trim(trimmed.substr(colon + 1));
        if (!key.empty()) meta[key] = value;
    }
    return meta;
}

inline SFCBlock parse_sfc(const std::string& source, const std::string& name = "component") {
    SFCBlock block;
    block.name   = name;
    block.tmpl   = extract_block(source, "template");
    block.script = extract_block(source, "script");
    block.style  = extract_block(source, "style");
    block.meta   = parse_meta(extract_block(source, "meta"));
    return block;
}

} // namespace yawnc
