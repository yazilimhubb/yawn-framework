#pragma once
/**
 * yawnc — built-in HTTP server
 * Cross-platform: uses BSD sockets on Linux/macOS, Winsock on Windows.
 * Single-threaded with a basic request loop — fine for dev use.
 */

#ifdef _WIN32
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #pragma comment(lib, "ws2_32.lib")
  using socket_t = SOCKET;
  #define CLOSE_SOCKET closesocket
  #define SOCK_INVALID INVALID_SOCKET
#else
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <arpa/inet.h>
  #include <unistd.h>
  #include <fcntl.h>
  using socket_t = int;
  #define CLOSE_SOCKET close
  #define SOCK_INVALID (-1)
#endif

#include <string>
#include <map>
#include <vector>
#include <functional>
#include <sstream>
#include <iostream>
#include <thread>
#include <atomic>
#include <filesystem>
#include "utils.hpp"

namespace yawnc {

// ─── HTTP primitives ──────────────────────────────────────────────────────

struct HttpRequest {
    std::string method;
    std::string path;
    std::map<std::string, std::string> headers;
    std::string body;
};

struct HttpResponse {
    int         status  = 200;
    std::string content_type = "text/html; charset=utf-8";
    std::map<std::string, std::string> headers;
    std::string body;
};

inline std::string status_text(int code) {
    switch (code) {
        case 200: return "OK";
        case 301: return "Moved Permanently";
        case 302: return "Found";
        case 404: return "Not Found";
        case 500: return "Internal Server Error";
        default:  return "Unknown";
    }
}

inline std::string build_response(const HttpResponse& res) {
    std::ostringstream out;
    out << "HTTP/1.1 " << res.status << " " << status_text(res.status) << "\r\n";
    out << "Content-Type: " << res.content_type << "\r\n";
    out << "Content-Length: " << res.body.size() << "\r\n";
    out << "Connection: close\r\n";
    for (auto& [k, v] : res.headers) out << k << ": " << v << "\r\n";
    out << "\r\n" << res.body;
    return out.str();
}

inline HttpRequest parse_request(const std::string& raw) {
    HttpRequest req;
    std::istringstream ss(raw);
    std::string line;
    std::getline(ss, line);
    // "GET /path HTTP/1.1"
    std::istringstream rl(line);
    rl >> req.method >> req.path;
    // headers
    while (std::getline(ss, line) && line != "\r") {
        auto colon = line.find(':');
        if (colon != std::string::npos) {
            std::string key = utils::trim(line.substr(0, colon));
            std::string val = utils::trim(line.substr(colon + 1));
            req.headers[key] = val;
        }
    }
    return req;
}

// ─── HMR SSE clients ─────────────────────────────────────────────────────

static std::vector<socket_t> g_hmr_clients;

inline void hmr_broadcast(const std::string& event, const std::string& data = "") {
    std::string msg = "event: " + event + "\ndata: " + data + "\n\n";
    for (auto sock : g_hmr_clients) {
        ::send(sock, msg.c_str(), (int)msg.size(), 0);
    }
}

const std::string HMR_SCRIPT = R"(<script>
(function(){
  var es=new EventSource('/__yawnc_hmr');
  es.addEventListener('reload',function(){window.location.reload();});
  es.onerror=function(){setTimeout(function(){window.location.reload();},1500);};
})();
</script>)";

// ─── MIME types ───────────────────────────────────────────────────────────

inline std::string mime_for(const std::string& ext) {
    if (ext == ".html") return "text/html; charset=utf-8";
    if (ext == ".css")  return "text/css; charset=utf-8";
    if (ext == ".js")   return "application/javascript; charset=utf-8";
    if (ext == ".mjs")  return "application/javascript; charset=utf-8";
    if (ext == ".json") return "application/json; charset=utf-8";
    if (ext == ".svg")  return "image/svg+xml";
    if (ext == ".png")  return "image/png";
    if (ext == ".jpg" || ext == ".jpeg") return "image/jpeg";
    if (ext == ".ico")  return "image/x-icon";
    if (ext == ".woff2") return "font/woff2";
    return "application/octet-stream";
}

// ─── Server ───────────────────────────────────────────────────────────────

struct ServerOptions {
    int         port     = 3000;
    std::string host     = "127.0.0.1";
    std::string root_dir = ".";
    std::function<std::string(const std::string&)> handler; // pathname → html or ""
};

class DevServer {
public:
    ServerOptions opts;
    std::atomic<bool> running{false};

    explicit DevServer(ServerOptions o) : opts(std::move(o)) {}

    void start() {
#ifdef _WIN32
        WSADATA wsa;
        WSAStartup(MAKEWORD(2,2), &wsa);
#endif
        socket_t srv = ::socket(AF_INET, SOCK_STREAM, 0);
        if (srv == SOCK_INVALID) { std::cerr << "  [yawnc] socket error\n"; return; }

        int reuse = 1;
#ifdef _WIN32
        setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, (char*)&reuse, sizeof(reuse));
#else
        setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));
#endif
        sockaddr_in addr{};
        addr.sin_family      = AF_INET;
        addr.sin_port        = htons((uint16_t)opts.port);
        addr.sin_addr.s_addr = INADDR_ANY;

        if (::bind(srv, (sockaddr*)&addr, sizeof(addr)) < 0) {
            std::cerr << "  [yawnc] Port " << opts.port << " is already in use.\n";
            CLOSE_SOCKET(srv);
            return;
        }
        ::listen(srv, 16);
        running = true;
        std::cout << "\n  Yawn dev server  ->  http://" << opts.host << ":" << opts.port << "\n\n";

        while (running) {
            socket_t client = ::accept(srv, nullptr, nullptr);
            if (client == SOCK_INVALID) continue;
            handle(client);
            CLOSE_SOCKET(client);
        }
        CLOSE_SOCKET(srv);
    }

    void reload() { hmr_broadcast("reload"); }
    void stop()   { running = false; }

private:
    void handle(socket_t client) {
        char buf[8192] = {};
        int n = (int)::recv(client, buf, sizeof(buf)-1, 0);
        if (n <= 0) return;
        std::string raw(buf, n);
        auto req = parse_request(raw);

        // HMR SSE endpoint
        if (req.path == "/__yawnc_hmr") {
            std::string head =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: text/event-stream\r\n"
                "Cache-Control: no-cache\r\n"
                "Connection: keep-alive\r\n"
                "Access-Control-Allow-Origin: *\r\n\r\n"
                ":\n\n";
            ::send(client, head.c_str(), (int)head.size(), 0);
            g_hmr_clients.push_back(client);
            // keep connection alive (blocking — ok for single-threaded demo)
            return;
        }

        // Custom page handler
        if (opts.handler) {
            std::string html = opts.handler(req.path);
            if (!html.empty()) {
                // inject HMR script
                auto pos = html.rfind("</body>");
                if (pos != std::string::npos) html.insert(pos, HMR_SCRIPT);
                HttpResponse res;
                res.body = html;
                auto raw_res = build_response(res);
                ::send(client, raw_res.c_str(), (int)raw_res.size(), 0);
                return;
            }
        }

        // Static file serving from root_dir
        namespace fs = std::filesystem;
        std::string file_path = opts.root_dir + req.path;
        if (req.path == "/") file_path = opts.root_dir + "/index.html";
        if (fs::exists(file_path) && fs::is_regular_file(file_path)) {
            std::string ext = fs::path(file_path).extension().string();
            std::string content = utils::read_file(file_path);
            HttpResponse res;
            res.content_type = mime_for(ext);
            res.body = content;
            auto raw_res = build_response(res);
            ::send(client, raw_res.c_str(), (int)raw_res.size(), 0);
            return;
        }

        // 404
        HttpResponse res;
        res.status = 404;
        res.body   = "<!doctype html><html><body style='font-family:system-ui;text-align:center;padding:4rem'>"
                     "<h1 style='font-size:4rem;margin:0'>404</h1><p>" + req.path + " not found</p>"
                     "<a href='/'>Back home</a>" + HMR_SCRIPT + "</body></html>";
        auto raw_res = build_response(res);
        ::send(client, raw_res.c_str(), (int)raw_res.size(), 0);
    }
};

} // namespace yawnc
