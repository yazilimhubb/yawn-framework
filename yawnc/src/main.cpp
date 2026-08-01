#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <sstream>
#include <fstream>

#include "cli.hpp"

int main(int argc, char* argv[]) {
    std::vector<std::string> args(argv + 1, argv + argc);

    if (args.empty() || args[0] == "help" || args[0] == "--help") {
        yawnc::cli::show_help();
        return 0;
    }

    const std::string cmd = args[0];
    const std::string dir = args.size() > 1 ? args[1] : ".";

    if (cmd == "dev") {
        return yawnc::cli::cmd_dev(dir, args);
    } else if (cmd == "build") {
        return yawnc::cli::cmd_build(dir, args);
    } else if (cmd == "init") {
        return yawnc::cli::cmd_init(dir, args);
    } else if (cmd == "version" || cmd == "--version" || cmd == "-v") {
        return yawnc::cli::cmd_version();
    } else if (cmd == "create") {
        const std::string type = args.size() > 1 ? args[1] : "";
        const std::string name = args.size() > 2 ? args[2] : "";
        const std::string cdir = args.size() > 3 ? args[3] : ".";
        return yawnc::cli::cmd_create(type, name, cdir);
    } else {
        std::cerr << "  Unknown command: " << cmd << "\n";
        std::cerr << "  Run: yawn help\n";
        return 1;
    }
}
