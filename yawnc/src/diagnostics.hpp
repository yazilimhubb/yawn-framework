#pragma once
/**
 * yawnc — Diagnostics & Error Reporting
 *
 * Provides structured error messages with:
 *   - Source file / line / column tracking
 *   - Pretty-printed context with caret (^) indicator
 *   - Color-coded severity levels
 *   - Error collection for batch reporting
 */

#include <string>
#include <vector>
#include <sstream>
#include <iostream>
#include <algorithm>

namespace yawnc {

// ─── Source Location ─────────────────────────────────────────────────────────

struct SourceLoc {
    std::string file;
    int         line   = 0;
    int         col    = 0;
    int         length = 1;  // length of the highlighted span

    std::string to_string() const {
        std::string s;
        if (!file.empty()) s += file + ":";
        if (line > 0) {
            s += std::to_string(line);
            if (col > 0) s += ":" + std::to_string(col);
        }
        return s;
    }
};

// ─── Severity ────────────────────────────────────────────────────────────────

enum class DiagLevel {
    Error,
    Warning,
    Info,
    Hint,
};

inline const char* diag_level_str(DiagLevel level) {
    switch (level) {
        case DiagLevel::Error:   return "error";
        case DiagLevel::Warning: return "warning";
        case DiagLevel::Info:    return "info";
        case DiagLevel::Hint:    return "hint";
    }
    return "unknown";
}

inline const char* diag_level_color(DiagLevel level) {
    switch (level) {
        case DiagLevel::Error:   return "\x1b[91m";  // bright red
        case DiagLevel::Warning: return "\x1b[93m";  // bright yellow
        case DiagLevel::Info:    return "\x1b[96m";   // bright cyan
        case DiagLevel::Hint:    return "\x1b[92m";   // bright green
    }
    return "\x1b[0m";
}

// ─── Diagnostic ──────────────────────────────────────────────────────────────

struct Diagnostic {
    DiagLevel   level;
    std::string message;
    SourceLoc   loc;
    std::string source_line;  // the actual source line for context display
    std::string hint;         // optional "did you mean?" or fix suggestion

    // Format as a pretty string with colors
    std::string format(bool colors = true) const {
        const char* RST  = colors ? "\x1b[0m"  : "";
        const char* BOLD = colors ? "\x1b[1m"  : "";
        const char* DIM  = colors ? "\x1b[2m"  : "";
        const char* CLR  = colors ? diag_level_color(level) : "";

        std::ostringstream out;

        // Location + severity + message
        out << BOLD;
        if (!loc.file.empty()) out << loc.file << ":";
        if (loc.line > 0) {
            out << loc.line;
            if (loc.col > 0) out << ":" << loc.col;
        }
        out << RST << " " << CLR << BOLD << diag_level_str(level) << RST
            << ": " << BOLD << message << RST << "\n";

        // Source context with caret
        if (!source_line.empty() && loc.line > 0) {
            std::string line_num = std::to_string(loc.line);
            std::string padding(line_num.size(), ' ');

            out << DIM << " " << padding << " |" << RST << "\n";
            out << DIM << " " << line_num << " | " << RST << source_line << "\n";
            out << DIM << " " << padding << " | " << RST;

            // Caret indicator
            int col = std::max(0, loc.col - 1);
            for (int i = 0; i < col; i++) {
                out << (source_line[i] == '\t' ? '\t' : ' ');
            }
            out << CLR;
            int span = std::max(1, loc.length);
            for (int i = 0; i < span; i++) out << "^";
            out << RST << "\n";
        }

        // Hint
        if (!hint.empty()) {
            out << DIM << "  = " << RST << "hint: " << hint << "\n";
        }

        return out.str();
    }
};

// ─── Diagnostic Collector ────────────────────────────────────────────────────

class DiagnosticCollector {
public:
    std::vector<Diagnostic> diagnostics;

    void error(const std::string& msg, const SourceLoc& loc = {},
               const std::string& src_line = "", const std::string& hint = "") {
        diagnostics.push_back({DiagLevel::Error, msg, loc, src_line, hint});
    }

    void warning(const std::string& msg, const SourceLoc& loc = {},
                 const std::string& src_line = "", const std::string& hint = "") {
        diagnostics.push_back({DiagLevel::Warning, msg, loc, src_line, hint});
    }

    void info(const std::string& msg, const SourceLoc& loc = {},
              const std::string& src_line = "", const std::string& hint = "") {
        diagnostics.push_back({DiagLevel::Info, msg, loc, src_line, hint});
    }

    void hint(const std::string& msg, const SourceLoc& loc = {},
              const std::string& src_line = "", const std::string& h = "") {
        diagnostics.push_back({DiagLevel::Hint, msg, loc, src_line, h});
    }

    bool has_errors() const {
        return std::any_of(diagnostics.begin(), diagnostics.end(),
            [](const Diagnostic& d) { return d.level == DiagLevel::Error; });
    }

    int error_count() const {
        return (int)std::count_if(diagnostics.begin(), diagnostics.end(),
            [](const Diagnostic& d) { return d.level == DiagLevel::Error; });
    }

    int warning_count() const {
        return (int)std::count_if(diagnostics.begin(), diagnostics.end(),
            [](const Diagnostic& d) { return d.level == DiagLevel::Warning; });
    }

    void print_all(bool colors = true) const {
        for (const auto& d : diagnostics) {
            std::cerr << d.format(colors);
        }
        if (!diagnostics.empty()) {
            const char* RST  = colors ? "\x1b[0m"  : "";
            const char* BOLD = colors ? "\x1b[1m"  : "";
            const char* RED  = colors ? "\x1b[91m" : "";
            const char* YEL  = colors ? "\x1b[93m" : "";

            int errors   = error_count();
            int warnings = warning_count();
            std::cerr << "\n";
            if (errors > 0)
                std::cerr << RED << BOLD << errors << " error(s)" << RST;
            if (errors > 0 && warnings > 0)
                std::cerr << ", ";
            if (warnings > 0)
                std::cerr << YEL << warnings << " warning(s)" << RST;
            std::cerr << "\n\n";
        }
    }

    void clear() { diagnostics.clear(); }
};

// ─── Source helper — extract line from source by line number ──────────────────

inline std::string get_source_line(const std::string& source, int line_num) {
    if (line_num <= 0) return "";
    int current = 1;
    size_t pos = 0;
    while (pos < source.size() && current < line_num) {
        if (source[pos] == '\n') current++;
        pos++;
    }
    if (current != line_num) return "";
    size_t end = source.find('\n', pos);
    std::string line = (end == std::string::npos) ? source.substr(pos) : source.substr(pos, end - pos);
    // Strip trailing \r
    if (!line.empty() && line.back() == '\r') line.pop_back();
    return line;
}

// ─── Compute line/col from offset ────────────────────────────────────────────

inline SourceLoc offset_to_loc(const std::string& source, size_t offset,
                                const std::string& file = "") {
    SourceLoc loc;
    loc.file = file;
    loc.line = 1;
    loc.col  = 1;
    for (size_t i = 0; i < offset && i < source.size(); i++) {
        if (source[i] == '\n') { loc.line++; loc.col = 1; }
        else loc.col++;
    }
    return loc;
}

} // namespace yawnc
