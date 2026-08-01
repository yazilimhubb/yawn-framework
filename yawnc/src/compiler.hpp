#pragma once
#include <string>
#include <map>
#include <optional>
#include <functional>
#include <regex>
#include "parser.hpp"
#include "renderer.hpp"
#include "script_parser.hpp"
#include "utils.hpp"

namespace yawnc {

struct CompileOptions {
    bool        tailwind         = true;
    bool        full_page        = true;
    std::string title            = "Yawn App";
    std::string extra_css;
    std::function<std::optional<std::string>(const std::string&)> resolve_component;
};

struct CompiledSFC {
    std::string html;
    std::string client_script;
    std::string style_tag;
};

inline std::string scope_style(const std::string& css, const std::string& scope_id) {
    std::regex rule_re(R"(([^{}]+)\{)");
    std::string out;
    std::sregex_iterator it(css.begin(), css.end(), rule_re);
    std::sregex_iterator end;
    size_t pos = 0;

    for (; it != end; ++it) {
        const auto& m = *it;
        out += css.substr(pos, m.position() - pos);
        std::string selector = m[1].str();
        auto parts = utils::split(selector, ',');
        std::string scoped;
        for (size_t i = 0; i < parts.size(); i++) {
            if (i > 0) scoped += ", ";
            scoped += "[data-yawnc-scope=\"" + scope_id + "\"] " + utils::trim(parts[i]);
        }
        out += scoped + " {";
        pos = m.position() + m.length();
    }
    out += css.substr(pos);
    return out;
}

inline std::string generate_client_runtime(const SFCBlock& block,
                                            const std::vector<ScriptVar>& vars) {
    std::string scope_id  = block.name;
    std::string init_state;
    for (size_t i = 0; i < vars.size(); i++) {
        if (i > 0) init_state += ",\n";
        init_state += "  " + vars[i].name + ": " + vars[i].raw_init;
    }

    std::string tpl_escaped = block.tmpl;
    tpl_escaped = utils::replace_all(tpl_escaped, "\\", "\\\\");
    tpl_escaped = utils::replace_all(tpl_escaped, "`", "\\`");
    tpl_escaped = utils::replace_all(tpl_escaped, "${", "\\${");

    std::string globals;
    for (const auto& v : vars) {
        globals += "Object.defineProperty(window,'" + v.name +
                   "',{get:()=>state['" + v.name +
                   "'],set:v=>{state['" + v.name + "']=v;}});\n  ";
    }

    return R"(<script>
(function() {
  'use strict';
  const __raw = {
)" + init_state + R"(
  };

  function __esc(v) {
    if (v == null) return '';
    return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  let __tick = false;
  const state = new Proxy(__raw, {
    set(t,k,v) { t[k]=v; if(!__tick){__tick=true;queueMicrotask(()=>{__tick=false;__render();});} return true; }
  });

  )" + globals + R"(

  const __tpl = `)" + tpl_escaped + R"(`;
  const __root = document.querySelector('[data-yawnc-scope=")" + scope_id + R"("]') || document.body;

  function __evalExpr(expr, extra) {
    var s = Object.assign({}, state, extra || {});
    try { return Function.apply(null, Object.keys(s).concat(['return (' + expr + ')'])).apply(null, Object.values(s)); }
    catch(e) { return undefined; }
  }

  function __processEach(h) {
    var EACH = / :each="(\w+)(?:,\s*(\w+))?\s+in\s+([^"]+)"/;
    var result = '', pos = 0;
    while (pos < h.length) {
      var ts = h.indexOf('<', pos); if (ts < 0) { result += h.slice(pos); break; }
      var te = h.indexOf('>', ts);  if (te < 0) { result += h.slice(pos); break; }
      var th = h.slice(ts, te+1);
      var em = th.match(EACH);
      if (!em) { result += h.slice(pos, te+1); pos = te+1; continue; }
      var iv=em[1], xv=em[2], lk=em[3];
      var tn = (th.match(/^<([\w-]+)/) || [])[1]; if (!tn) { result += h.slice(pos, te+1); pos=te+1; continue; }
      if (th.trimEnd().endsWith('/>')) { result += h.slice(pos, ts); pos=te+1; continue; }
      var cl='</'+tn+'>', dep=1, sp=te+1, ie=-1;
      while (sp<h.length&&dep>0){ var no=h.indexOf('<'+tn,sp),nc=h.indexOf(cl,sp); if(nc<0)break; if(no>=0&&no<nc){dep++;sp=no+1;}else{dep--;if(!dep)ie=nc;else sp=nc+1;} }
      if (ie<0) { result+=h.slice(pos,te+1); pos=te+1; continue; }
      result += h.slice(pos, ts);
      var inner=h.slice(te+1,ie), attrs=th.replace(EACH,'').replace(/^<[\w-]+/,'').replace(/>$/,'').replace(/\/$/,'').trim();
      var items=__evalExpr(lk);
      if(!Array.isArray(items)) items = [];
      result += items.map(function(val,idx){ var ex={}; ex[iv]=val; ex['$index']=idx; if(xv)ex[xv]=idx; return '<'+tn+(attrs?' '+attrs:'')+'>'+__render2(inner,ex)+'</'+tn+'>'; }).join('');
      pos = ie + cl.length;
    }
    return result;
  }

  function __processIf(h, es) {
    var IF_RE=/ :if="([^"]+)"/; var result='',pos=0, s=Object.assign({},state,es||{});
    while (pos<h.length) {
      var ts=h.indexOf('<',pos); if(ts<0){result+=h.slice(pos);break;}
      var te=h.indexOf('>',ts); if(te<0){result+=h.slice(pos);break;}
      var th=h.slice(ts,te+1), im=th.match(IF_RE);
      if(!im){result+=h.slice(pos,te+1);pos=te+1;continue;}
      var expr=im[1], tn=(th.match(/^<([\w-]+)/)||[])[1]; if(!tn){result+=h.slice(pos,te+1);pos=te+1;continue;}
      var cl='</'+tn+'>', dep=1, sp=te+1, ie=-1;
      while(sp<h.length&&dep>0){var no=h.indexOf('<'+tn,sp),nc=h.indexOf(cl,sp);if(nc<0)break;if(no>=0&&no<nc){dep++;sp=no+1;}else{dep--;if(!dep)ie=nc;else sp=nc+1;}}
      if(ie<0){result+=h.slice(pos,te+1);pos=te+1;continue;}
      result+=h.slice(pos,ts);
      var inner=h.slice(te+1,ie),ab=th.replace(IF_RE,'').replace(/^<[\w-]+/,'').replace(/>$/,'').trim();
      var show=!!__evalExpr(expr,es);
      var ep=ie+cl.length, after=h.slice(ep);
      var em=after.match(/^(\s*)<([\w-]*)([^>]*?) :else([^>]*)>([\s\S]*?)<\/\2>/);
      if(em){ if(show)result+='<'+tn+ab+'>'+__render2(inner,es)+'</'+tn+'>'; else result+='<'+em[2]+(em[3]+em[4]).replace(/ :else\b/,'')+'>'+__render2(em[5],es)+'</'+em[2]+'>'; pos=ep+em[0].length; }
      else { if(show)result+='<'+tn+ab+'>'+__render2(inner,es)+'</'+tn+'>'; pos=ep; }
    }
    return result;
  }

  function __render2(tpl, es) {
    var h=tpl, s=Object.assign({},state,es||{});
    h=h.replace(/ @([\w:]+)="([^"]*)"/g,function(_,ev,fn){return ' data-yawnc-on-'+ev+'="'+fn.replace(/"/g,'&quot;')+'"';});
    h=h.replace(/ :model="(\w+)"/g,function(_,v){return ' data-yawnc-on-input="'+v+'=event.target.value" data-yawnc-model="'+v+'" value="'+__esc(s[v])+'"';});
    h=__processEach(h);
    h=__processIf(h,es);
    h=h.replace(/ :bind:([\w-]+)="([^"]+)"/g,function(_,a,expr){try{var v=__evalExpr(expr,es);return(v!=null&&v!==false)?' '+a+'="'+__esc(v)+'"':'';}catch(e){return '';}});
    h=h.replace(/ :class="([^"]+)"/g,function(_,expr){try{var v=__evalExpr(expr,es);if(!v)return '';if(typeof v==='object'&&!Array.isArray(v))v=Object.keys(v).filter(k=>v[k]).join(' ');if(Array.isArray(v))v=v.join(' ');return v?' class="'+__esc(v)+'"':'';}catch(e){return '';}});
    h=h.replace(/\{\{([^}]+)\}\}/g,function(_,expr){try{return __esc(__evalExpr(expr,es));}catch(e){return '';}});
    h=h.replace(/ @[\w:]+="[^"]*"/g,'');
    h=h.replace(/ :(?:if|else|each|bind:[\w-]+|class|style|model)(?:="[^"]*")?/g,'');
    return h;
  }

  function __bindEvents() {
    __root.querySelectorAll('*').forEach(function(el){
      Array.from(el.attributes||[]).forEach(function(a){
        if(!a.name.startsWith('data-yawnc-on-'))return;
        var ev=a.name.slice(14),fn=a.value; el.removeAttribute(a.name);
        el.addEventListener(ev,function(e){
          try{var body=Object.keys(__raw).map(k=>'var '+k+'=state[\''+k+'\'];').join('')+fn+';'+Object.keys(__raw).map(k=>'state[\''+k+'\']='+k+';').join('');Function('e','event','state',body).call(el,e,e,state);}
          catch(err){console.error('[yawnc]',err);}
        });
      });
      var mv=el.getAttribute&&el.getAttribute('data-yawnc-model');
      if(mv&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA')){if(document.activeElement!==el)el.value=state[mv]!=null?String(state[mv]):'';}
    });
  }

  function __render() { __root.innerHTML=__render2(__tpl); __bindEvents(); }
  __render();
})();
</script>)";
}

inline CompiledSFC compile_sfc(const std::string& source,
                                const std::string& name = "app",
                                const CompileOptions& opts = {}) {
    auto block = parse_sfc(source, name);
    auto vars = ScriptParser::parse(block.script);

    Env state;
    for (const auto& v : vars) {
        state[v.name] = v.value;
    }

    std::string title = opts.title;
    if (auto it = block.meta.find("title"); it != block.meta.end() && title == "Yawn App") {
        title = it->second;
    }

    std::string tpl = block.tmpl;
    if (opts.resolve_component) {
        std::regex comp_re(R"(<([A-Z][a-zA-Z0-9]*)([^/]*?)\s*/>)");
        std::string expanded;
        std::sregex_iterator it(tpl.begin(), tpl.end(), comp_re);
        std::sregex_iterator end;
        size_t pos = 0;

        for (; it != end; ++it) {
            const auto& m = *it;
            expanded += tpl.substr(pos, m.position() - pos);
            std::string comp_name = m[1].str();
            auto comp_src = opts.resolve_component(comp_name);
            if (comp_src) {
                auto cb = parse_sfc(*comp_src, comp_name);
                auto cvars = ScriptParser::parse(cb.script);
                Env cstate;
                for (const auto& v : cvars) {
                    cstate[v.name] = v.value;
                }
                std::string attrs_raw = m[2].str();
                std::regex prop_re(R"(([\w-]+)="([^"]*)")");
                std::sregex_iterator pit(attrs_raw.begin(), attrs_raw.end(), prop_re);
                std::sregex_iterator pend;
                for (; pit != pend; ++pit) {
                    cstate[(*pit)[1].str()] = YawnValue((*pit)[2].str());
                }
                Renderer r(cstate);
                expanded += r.render(cb.tmpl);
            } else {
                expanded += m[0].str();
            }
            pos = m.position() + m.length();
        }
        expanded += tpl.substr(pos);
        tpl = expanded;
    }

    Renderer renderer(state);
    renderer.resolve_component = opts.resolve_component;
    std::string ssr_html = renderer.render(tpl);

    std::string style_tag;
    if (!block.style.empty()) {
        style_tag = "<style>\n" + scope_style(block.style, name) + "\n</style>";
    }

    std::string client_script = generate_client_runtime(block, vars);

    if (!opts.full_page) {
        std::string html = "<div data-yawnc-scope=\"" + name + "\">" + ssr_html + "</div>";
        if (!style_tag.empty()) html += "\n" + style_tag;
        html += "\n" + client_script;
        return {html, client_script, style_tag};
    }

    std::string meta_tags;
    if (auto it = block.meta.find("description"); it != block.meta.end()) {
        meta_tags += "  <meta name=\"description\" content=\"" + utils::escape_html(it->second) + "\" />\n";
    }
    if (auto it = block.meta.find("og:title"); it != block.meta.end()) {
        meta_tags += "  <meta property=\"og:title\" content=\"" + utils::escape_html(it->second) + "\" />\n";
    }

    std::string html =
        "<!doctype html>\n"
        "<html lang=\"en\">\n"
        "<head>\n"
        "  <meta charset=\"utf-8\" />\n"
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        "  <title>" + utils::escape_html(title) + "</title>\n" +
        meta_tags +
        (opts.tailwind ? "  <script src=\"https://cdn.tailwindcss.com\"></script>\n" : "") +
        (!opts.extra_css.empty() ? "  <style>" + opts.extra_css + "</style>\n" : "") +
        (!style_tag.empty() ? "  " + style_tag + "\n" : "") +
        "</head>\n"
        "<body>\n"
        "  <div data-yawnc-scope=\"" + name + "\">\n"
        "    " + ssr_html + "\n"
        "  </div>\n"
        "  " + client_script + "\n"
        "</body>\n"
        "</html>\n";

    return {html, client_script, style_tag};
}

} // namespace yawnc
