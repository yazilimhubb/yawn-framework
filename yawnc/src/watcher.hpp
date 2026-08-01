#pragma once
#include <string>
#include <vector>
#include <map>
#include <thread>
#include <chrono>
#include <filesystem>
#include <functional>

namespace yawnc {

class FileWatcher {
public:
    explicit FileWatcher(std::string dir, std::function<void(const std::string&)> cb)
        : dir_(std::move(dir)), cb_(std::move(cb)) {}

    void start() {
        run_ = true;
        thread_ = std::thread([this]() {
            namespace fs = std::filesystem;
            std::map<std::string, fs::file_time_type> mtimes;
            while (run_) {
                std::this_thread::sleep_for(std::chrono::milliseconds(250));
                bool changed = false;
                std::string changed_file;
                try {
                    for (const auto& e : fs::recursive_directory_iterator(dir_)) {
                        if (!e.is_regular_file()) continue;
                        auto ext = e.path().extension().string();
                        if (ext != ".yawn" && ext != ".css" && ext != ".ts" && ext != ".js") continue;
                        auto mtime = e.last_write_time();
                        auto& stored = mtimes[e.path().string()];
                        if (mtime != stored) {
                            stored = mtime;
                            changed = true;
                            changed_file = e.path().string();
                        }
                    }
                } catch (...) {}
                if (changed && cb_) {
                    cb_(changed_file);
                }
            }
        });
    }

    void stop() {
        run_ = false;
        if (thread_.joinable()) thread_.join();
    }

    ~FileWatcher() {
        stop();
    }

private:
    std::string dir_;
    std::function<void(const std::string&)> cb_;
    std::thread thread_;
    bool run_ = false;
};

} // namespace yawnc
