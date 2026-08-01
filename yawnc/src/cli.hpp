#pragma once
#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include <thread>
#include <chrono>
#include "compiler.hpp"
#include "server.hpp"
#include "watcher.hpp"
#include "utils.hpp"

namespace yawnc::cli {

namespace fs = std::filesystem;

namespace C {
  const char* RESET   = "\x1b[0m";
  const char* BOLD    = "\x1b[1m";
  const char* DIM     = "\x1b[2m";
  const char* RED     = "\x1b[31m";
  const char* GREEN   = "\x1b[32m";
  const char* YELLOW  = "\x1b[33m";
  const char* BLUE    = "\x1b[34m";
  const char* MAGENTA = "\x1b[35m";
  const char* CYAN    = "\x1b[36m";
  const char* WHITE   = "\x1b[37m";
  const char* BRED    = "\x1b[91m";
  const char* BGREEN  = "\x1b[92m";
  const char* BYELLOW = "\x1b[93m";
  const char* BBLUE   = "\x1b[94m";
  const char* BMAGENTA= "\x1b[95m";
  const char* BCYAN   = "\x1b[96m";
  const char* BWHITE  = "\x1b[97m";
}

inline std::string rainbow(const std::string& text) {
  const char* colors[] = { C::BRED, C::BYELLOW, C::BGREEN, C::BCYAN, C::BBLUE, C::BMAGENTA };
  const int N = 6;
  std::string out;
  int i = 0;
  for (char ch : text) {
    if (ch == ' ') { out += ch; continue; }
    out += colors[i % N];
    out += ch;
    out += C::RESET;
    i++;
  }
  return out;
}

inline void log_ok(const std::string& msg) {
  std::cout << "  " << C::BGREEN << "+" << C::RESET << " " << msg << "\n";
}
inline void log_info(const std::string& msg) {
  std::cout << "  " << C::BCYAN  << ">" << C::RESET << " " << msg << "\n";
}
inline void log_warn(const std::string& msg) {
  std::cout << "  " << C::BYELLOW << "!" << C::RESET << " " << msg << "\n";
}
inline void log_err(const std::string& msg) {
  std::cerr << "  " << C::BRED << "x" << C::RESET << " " << C::RED << msg << C::RESET << "\n";
}
inline void log_dim(const std::string& msg) {
  std::cout << "  " << C::DIM << msg << C::RESET << "\n";
}
inline void log_step(const std::string& msg) {
  std::cout << "\n  " << C::BOLD << C::BCYAN << "-- " << msg << C::RESET << "\n\n";
}

inline void show_banner() {
  std::cout << "\n  " << rainbow("Yawn Framework") << "  "
            << C::DIM << "C++ Native Runtime" << C::RESET << "\n\n";
}

inline void show_help() {
  show_banner();
  std::cout << "  " << C::BOLD << "Usage" << C::RESET << ": yawn <command> [options]\n\n";
  std::cout << "  " << C::BOLD << "Commands" << C::RESET << ":\n";
  std::cout << "    " << C::BBLUE    << "dev"    << C::RESET << "  [dir]              Start dev server with hot reload\n";
  std::cout << "    " << C::BMAGENTA << "build"  << C::RESET << "  [dir]              Build .yawn pages to static HTML\n";
  std::cout << "    " << C::BGREEN   << "init"   << C::RESET << "  [dir]              Scaffold new project\n";
  std::cout << "    " << C::BCYAN    << "create" << C::RESET << "  page <Name> [dir]  Create a new page\n";
  std::cout << "    " << C::BCYAN    << "create" << C::RESET << "  component <N> [d]  Create a new component\n";
  std::cout << "    " << C::BWHITE   << "version" << C::RESET << "                     Show version information\n\n";
  std::cout << "  " << C::DIM << "Example: yawn dev ./my-site" << C::RESET << "\n\n";
}

inline std::map<std::string, std::string> discover_routes(const std::string& pages_dir) {
  std::map<std::string, std::string> routes;
  if (!fs::exists(pages_dir)) return routes;
  for (const auto& e : fs::recursive_directory_iterator(pages_dir)) {
    if (!e.is_regular_file()) continue;
    if (e.path().extension() != ".yawn") continue;
    std::string stem = e.path().stem().string();
    if (!stem.empty() && stem[0] == '_') continue;
    std::string rel = fs::relative(e.path(), pages_dir).string();
    std::replace(rel.begin(), rel.end(), '\\', '/');
    rel = rel.substr(0, rel.size() - 5);
    std::string route = (stem == "index") ? "/" : "/" + rel;
    routes[route] = e.path().string();
  }
  return routes;
}

inline std::string render_page(const std::string& page_path,
                                const std::string& layout_path,
                                const std::string& comps_dir,
                                const std::string& title = "Yawn App") {
  auto resolve_comp = [&](const std::string& name) -> std::optional<std::string> {
    std::string p = comps_dir + "/" + name + ".yawn";
    if (fs::exists(p)) return utils::read_file(p);
    return std::nullopt;
  };

  CompileOptions page_opts;
  page_opts.title              = title;
  page_opts.resolve_component  = resolve_comp;

  std::string page_src = utils::read_file(page_path);
  std::string page_name = fs::path(page_path).stem().string();

  if (!layout_path.empty() && fs::exists(layout_path)) {
    page_opts.full_page = false;
    page_opts.tailwind  = false;
    auto page_compiled  = compile_sfc(page_src, page_name, page_opts);

    CompileOptions layout_opts;
    layout_opts.title             = title;
    layout_opts.tailwind          = true;
    layout_opts.resolve_component = resolve_comp;
    std::string layout_src = utils::read_file(layout_path);
    auto layout_compiled   = compile_sfc(layout_src, "_layout", layout_opts);

    std::string html = layout_compiled.html;
    std::string slot_pattern = "{{ slot }}";
    size_t pos = html.find(slot_pattern);
    if (pos == std::string::npos) {
      std::regex slot_re(R"(\{\{\s*slot\s*\}\})");
      html = std::regex_replace(html, slot_re, page_compiled.html);
    } else {
      html.replace(pos, slot_pattern.size(), page_compiled.html);
    }
    return html;
  }

  page_opts.full_page = true;
  page_opts.tailwind  = true;
  return compile_sfc(page_src, page_name, page_opts).html;
}

inline int cmd_dev(const std::string& dir, const std::vector<std::string>& args) {
  show_banner();
  std::string abs_dir  = fs::absolute(dir).string();
  std::string src_dir  = abs_dir + "/src";
  std::string pages    = src_dir + "/pages";
  std::string layout   = src_dir + "/_layout.yawn";
  std::string comps    = src_dir + "/components";
  std::string pub_dir  = abs_dir + "/public";

  int port = 3000;
  for (size_t i = 0; i < args.size(); i++) {
    if (args[i] == "--port" && i + 1 < args.size())
      port = std::stoi(args[i+1]);
  }

  if (!fs::exists(src_dir)) {
    log_err("No src/ directory found in " + abs_dir);
    log_info("Run:  yawn init [dir]");
    return 1;
  }

  log_step("Starting dev server");
  log_info("pages  " + C::DIM + pages + C::RESET);
  if (fs::exists(layout)) log_info("layout " + C::DIM + layout + C::RESET);

  FileWatcher watcher(src_dir, [](const std::string& file) {
    std::cout << "  " << C::BYELLOW << "~" << C::RESET << " " << C::DIM << "file changed (" << fs::path(file).filename().string() << ") — reloading" << C::RESET << "\n";
    hmr_broadcast("reload");
  });
  watcher.start();

  ServerOptions srv_opts;
  srv_opts.port     = port;
  srv_opts.root_dir = pub_dir;
  srv_opts.handler  = [&](const std::string& path) -> std::string {
    auto routes = discover_routes(pages);
    auto it = routes.find(path);
    if (it == routes.end()) return "";
    try {
      std::string page_name = fs::path(it->second).stem().string();
      std::string title = page_name.empty() ? "Yawn App"
          : (char)toupper(page_name[0]) + page_name.substr(1) + " — Yawn App";
      return render_page(it->second, layout, comps, title);
    } catch (const std::exception& e) {
      log_err(std::string("Render error: ") + e.what());
      return "<html><body style='font-family:monospace;padding:2rem;background:#000;color:#f87171'>"
             "<h2>Render Error</h2><pre>" + std::string(e.what()) + "</pre></body></html>";
    }
  };

  DevServer server(srv_opts);
  server.start();

  watcher.stop();
  return 0;
}

inline int cmd_build(const std::string& dir, const std::vector<std::string>&) {
  show_banner();
  std::string abs_dir = fs::absolute(dir).string();
  std::string src_dir = abs_dir + "/src";
  std::string pages   = src_dir + "/pages";
  std::string layout  = src_dir + "/_layout.yawn";
  std::string comps   = src_dir + "/components";
  std::string out_dir = abs_dir + "/dist";

  if (!fs::exists(pages)) {
    log_err("No src/pages/ directory found.");
    return 1;
  }

  log_step("Building");

  auto routes = discover_routes(pages);
  if (routes.empty()) {
    log_warn("No .yawn pages found in " + pages);
    return 0;
  }

  fs::create_directories(out_dir);
  int built = 0;

  for (auto& [route, file] : routes) {
    std::string page_name = fs::path(file).stem().string();
    std::string title = (char)toupper(page_name[0]) + page_name.substr(1) + " — Yawn App";
    std::string out_file = out_dir + (route == "/" ? "/index.html" : route + ".html");

    try {
      std::string html = render_page(file, layout, comps, title);
      fs::create_directories(fs::path(out_file).parent_path());
      utils::write_file(out_file, html);
      log_ok(C::DIM + fs::relative(out_file, abs_dir).string() + C::RESET);
      built++;
    } catch (const std::exception& e) {
      log_err("Failed: " + file + " — " + e.what());
    }
  }

  std::string pub = abs_dir + "/public";
  if (fs::exists(pub)) {
    for (const auto& e : fs::recursive_directory_iterator(pub)) {
      if (!e.is_regular_file()) continue;
      std::string rel = fs::relative(e.path(), pub).string();
      std::string dest = out_dir + "/" + rel;
      fs::create_directories(fs::path(dest).parent_path());
      fs::copy_file(e.path(), dest, fs::copy_options::overwrite_existing);
    }
    log_dim("copied public/ assets");
  }

  std::cout << "\n  " << C::BGREEN << C::BOLD << "Built " << built << " page(s)"
            << C::RESET << " -> " << C::DIM << out_dir << C::RESET << "\n\n";
  return 0;
}

inline int cmd_init(const std::string& dir, const std::vector<std::string>&) {
  show_banner();
  std::string abs_dir = fs::absolute(dir).string();
  std::string name = fs::path(abs_dir).filename().string();

  log_step("Scaffolding " + name);
  fs::create_directories(abs_dir + "/src/pages");
  fs::create_directories(abs_dir + "/src/components");
  fs::create_directories(abs_dir + "/public");

  utils::write_file(abs_dir + "/src/_layout.yawn", R"(<template>
  <div class="min-h-screen flex flex-col bg-black text-white">
    <header class="sticky top-0 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" class="font-black text-sm tracking-tight">)" + name + R"(</a>
        <nav class="flex gap-4 text-xs text-white/40">
          <a href="/" class="hover:text-white transition">Home</a>
          <a href="/about" class="hover:text-white transition">About</a>
        </nav>
      </div>
    </header>
    <main class="flex-1">{{ slot }}</main>
    <footer class="border-t border-white/10 py-6 text-center text-white/20 text-xs">
      Built with Yawn Framework (yawn)
    </footer>
  </div>
</template>
<script>
  let slot = "";
</script>
)");

  utils::write_file(abs_dir + "/src/pages/index.yawn", R"(<meta>
title: )" + name + R"(
description: Built with yawn
</meta>
<template>
  <div class="max-w-3xl mx-auto px-6 py-24 text-center">
    <h1 class="text-6xl font-black tracking-tight mb-6">
      Welcome to <span class="text-indigo-400">)" + name + R"(</span>
    </h1>
    <p class="text-white/40 text-lg mb-10">Built with yawn — native C++ Yawn runtime.</p>
    <div class="text-5xl font-black tabular-nums mb-6">{{ count }}</div>
    <div class="flex gap-3 justify-center">
      <button @click="count--"
        class="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-xl font-bold transition">-</button>
      <button @click="count = 0"
        class="px-5 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition">Reset</button>
      <button @click="count++"
        class="w-12 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xl font-bold transition">+</button>
    </div>
    <p :if="count > 9" class="mt-6 text-green-400 font-semibold">You passed 10!</p>
    <p :else class="mt-6 text-white/20 text-xs">Click the buttons</p>
  </div>
</template>
<script>
  let count = 0;
</script>
)");

  utils::write_file(abs_dir + "/src/pages/about.yawn", R"(<meta>
title: About
</meta>
<template>
  <div class="max-w-2xl mx-auto px-6 py-20">
    <a href="/" class="text-indigo-400 text-sm hover:text-indigo-300 transition mb-10 inline-block">Back home</a>
    <h1 class="text-4xl font-black tracking-tight mb-4">About</h1>
    <p class="text-white/40 leading-relaxed">
      Edit <code class="text-indigo-300">src/pages/about.yawn</code> to update this page.
    </p>
  </div>
</template>
<script></script>
)");

  utils::write_file(abs_dir + "/README.md",
    "# " + name + "\n\nBuilt with [yawn](https://github.com/yazilimhubb/yawn-framework).\n\n"
    "```bash\nyawn dev\n```\n");

  log_ok("src/_layout.yawn");
  log_ok("src/pages/index.yawn");
  log_ok("src/pages/about.yawn");
  log_ok("README.md");

  std::cout << "\n  " << C::BGREEN << C::BOLD << "Created " << name << C::RESET << "\n\n"
            << "  " << C::DIM << "Run:  yawn dev " << dir << C::RESET << "\n\n";
  return 0;
}

inline int cmd_create(const std::string& type, const std::string& name, const std::string& dir) {
  if (type.empty() || name.empty()) {
    log_err("Usage: yawn create <page|component> <Name> [dir]");
    return 1;
  }
  std::string abs_dir = fs::absolute(dir).string();
  std::string lower   = name;
  std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
  std::string display = (char)toupper(name[0]) + name.substr(1);

  if (type == "page") {
    std::string file = abs_dir + "/src/pages/" + lower + ".yawn";
    if (fs::exists(file)) { log_err("Page already exists: " + file); return 1; }
    fs::create_directories(fs::path(file).parent_path());
    utils::write_file(file,
      "<meta>\ntitle: " + display + "\ndescription: " + display + " page\n</meta>\n\n"
      "<template>\n  <div class=\"max-w-3xl mx-auto px-6 py-20\">\n"
      "    <a href=\"/\" class=\"text-indigo-400 text-sm hover:text-indigo-300 transition mb-10 inline-block\">"
      "Back home</a>\n"
      "    <h1 class=\"text-5xl font-black tracking-tight mb-6\">{{ title }}</h1>\n"
      "    <p class=\"text-white/40\">Edit <code class=\"text-indigo-300\">src/pages/" + lower + ".yawn</code></p>\n"
      "  </div>\n</template>\n\n<script>\n  let title = \"" + display + "\";\n</script>\n");
    log_ok("src/pages/" + lower + ".yawn  (route: /" + lower + ")");
    return 0;
  }

  if (type == "component") {
    std::string file = abs_dir + "/src/components/" + display + ".yawn";
    if (fs::exists(file)) { log_err("Component already exists: " + file); return 1; }
    fs::create_directories(fs::path(file).parent_path());
    utils::write_file(file,
      "<section class=\"" + lower + "\">\n"
      "  <h2>{{title}}</h2>\n"
      "  <p>{{subtitle}}</p>\n"
      "</section>\n");
    log_ok("src/components/" + display + ".yawn");
    return 0;
  }

  log_err("Unknown type: " + type + ". Use 'page' or 'component'.");
  return 1;
}

inline int cmd_version() {
  std::cout << "yawn version 0.3.0\n";
  return 0;
}

} // namespace yawnc::cli
