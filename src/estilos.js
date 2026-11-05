export const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&display=swap');
.ateliê{--tinta:#23224a;--papel:#eeedf3;--cartao:#fbfbfd;--linha:#d6d4e0;--suave:#6b6a85;--alerta:#b3261e;
  min-height:100vh;background:var(--papel);color:var(--tinta);padding:32px clamp(16px,4vw,48px);
  font-family:'Bricolage Grotesque',system-ui,sans-serif;box-sizing:border-box}
.ateliê *{box-sizing:border-box}
.topo{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px}
h1{margin:0;font-size:clamp(32px,6vw,52px);font-weight:800;letter-spacing:-.03em;line-height:1}
.abas{display:flex;gap:4px;background:#e0deea;border-radius:10px;padding:4px}
.abas a{padding:8px 16px;border-radius:7px;text-decoration:none;color:var(--suave);font-weight:600;font-size:15px}
.abas a:hover{color:var(--tinta)}
.abas a.active{background:var(--cartao);color:var(--tinta);box-shadow:0 1px 2px rgba(35,34,74,.18)}
.abas a:focus-visible{outline:3px solid #7f7cd6;outline-offset:2px}
.barra{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.total{margin:0;color:var(--suave);font-size:16px}
.filtros{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:24px}
.filtros input[type=search]{padding:10px 14px;border:1px solid var(--linha);border-radius:8px;background:var(--cartao);
  font:inherit;min-width:240px;color:inherit}
.check{display:flex;gap:8px;align-items:center;font-size:15px;cursor:pointer}
.grade{display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.tecido{background:var(--cartao);border:1px solid var(--linha);border-radius:12px;padding:20px}
.cab{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.cab h2{margin:0;font-size:20px;font-weight:600;flex:1;line-height:1.2}
.amostra{width:22px;height:22px;border-radius:50%;border:2px solid var(--cartao);outline:1px solid var(--linha);flex:none}
.aviso{font-size:13px;font-weight:600;color:var(--alerta);border:1px solid var(--alerta);border-radius:99px;padding:2px 10px}
.fita{height:22px;border-radius:3px;background:#e4e2ee;position:relative;overflow:hidden;
  background-image:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),rgba(35,34,74,.35) calc(10% - 1px) 10%)}
.fita-fill{height:100%;opacity:.85;transition:width .4s ease;mix-blend-mode:multiply}
.marca{position:absolute;top:0;bottom:0;width:3px;margin-left:-1px;background:var(--alerta)}
.fita-legenda{display:flex;justify-content:space-between;align-items:baseline;margin:8px 0 4px;font-size:14px;color:var(--suave)}
.fita-legenda strong{font-size:24px;color:var(--tinta);font-weight:800;letter-spacing:-.02em}
.minimo{margin:0 0 16px;font-size:13px;color:var(--suave)}
.dados{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;margin:0 0 18px;padding-top:16px;border-top:1px solid var(--linha)}
.dados dt{font-size:13px;color:var(--suave)}
.dados dd{margin:2px 0 0;font-size:17px;font-weight:600}
.acoes{display:flex;gap:8px;flex-wrap:wrap}
.acoes.fim{justify-content:flex-end;margin-top:20px}
.btn{font:inherit;font-size:14px;font-weight:600;padding:9px 14px;border-radius:8px;border:1px solid var(--tinta);
  background:transparent;color:var(--tinta);cursor:pointer;text-decoration:none;display:inline-block}
.btn:hover{background:rgba(35,34,74,.07)}
.btn.principal{background:var(--tinta);color:#fff}
.btn.principal:hover{background:#34336a}
.btn.principal:disabled{opacity:.4;cursor:not-allowed}
.btn.principal.perigo{background:var(--alerta);border-color:var(--alerta);color:#fff}
.btn.principal.perigo:hover{background:#8f1d17}
.btn.leve{border-color:transparent;color:var(--suave)}
.btn.leve.perigo:hover{color:var(--alerta)}
.btn:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #7f7cd6;outline-offset:2px}
.erro{color:var(--alerta);font-size:14px;margin:8px 0 0}
.falha{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;
  background:#fbeceb;border:1px solid #e8b9b6;border-radius:10px;padding:14px 18px;margin-bottom:24px}
.falha p{margin:0;color:var(--alerta);font-size:15px}
.vazio{color:var(--suave);padding:32px 0}
.fundo{position:fixed;inset:0;background:rgba(35,34,74,.45);display:grid;place-items:center;padding:16px;z-index:10}
.modal{background:var(--cartao);border-radius:12px;padding:24px;width:100%;max-width:400px;max-height:92vh;overflow-y:auto}
.modal h3{margin:0 0 16px;font-size:20px}
.modal .texto{margin:0;color:var(--suave);font-size:15px;line-height:1.5}
.modal label{display:block;font-size:14px;font-weight:600;margin-bottom:14px}
.modal input:not([type=color]){display:block;width:100%;margin-top:6px;padding:10px 12px;border:1px solid var(--linha);
  border-radius:8px;font:inherit;font-weight:400;background:#fff;color:inherit}
.modal input[type=color]{display:block;margin-top:6px;width:56px;height:36px;border:1px solid var(--linha);border-radius:8px;padding:2px;background:#fff}
.dica{display:block;margin-top:6px;font-size:13px;font-weight:400;color:var(--suave);line-height:1.4}
.seletor{padding:10px 14px;border:1px solid var(--linha);border-radius:8px;background:var(--cartao);font:inherit;color:inherit}
.historico{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.mov{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;
  background:var(--cartao);border:1px solid var(--linha);border-radius:10px;padding:14px 18px}
.mov-info,.mov-nums{display:flex;flex-direction:column;gap:4px}
.mov-nums{align-items:flex-end;font-size:18px;font-weight:800}
.mov-data{font-size:13px;font-weight:400;color:var(--suave)}
.tipo{align-self:flex-start;font-size:12px;font-weight:600;padding:2px 10px;border-radius:99px;border:1px solid var(--linha);color:var(--suave)}
.tipo.uso{color:#8a5a00;border-color:#8a5a00}
.tipo.reposicao{color:#1b6b3a;border-color:#1b6b3a}
.tipo.exclusao{color:var(--alerta);border-color:var(--alerta)}
.neg{color:var(--alerta)}
.pos{color:#1b6b3a}
@media (prefers-reduced-motion:reduce){.fita-fill{transition:none}}
`;
