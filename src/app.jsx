import { useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';

const API = 'http://localhost:3001/api/tecidos';

const brl = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const metros = (n) =>
  `${Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m`;

async function api(url = API, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const corpo = await res.json().catch(() => ({}));
    throw new Error(corpo.error || 'Falha na requisição');
  }
  return res.status === 204 ? null : res.json();
}

// Servidor fora do ar vira TypeError no fetch
const textoDoErro = (err, padrao) =>
  err instanceof TypeError
    ? 'Sem conexão com o servidor. Verifique se a API está rodando.'
    : err.message || padrao;

const minimo = (t) => Number(t.nr_metragem_minima) || 0;
const acabando = (t) => minimo(t) > 0 && Number(t.nr_metragem_atual) <= minimo(t);
const pct = (t) =>
  Number(t.nr_metragem_inicial) > 0
    ? Math.max(0, Math.min(100, (t.nr_metragem_atual / t.nr_metragem_inicial) * 100))
    : 0;

export default function App() {
  const [tecidos, setTecidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState('');
  const [busca, setBusca] = useState('');
  const [soAcabando, setSoAcabando] = useState(false);
  const [modal, setModal] = useState(null); // { tipo: 'tecido' | 'uso' | 'repor', tecido? }
  const [excluindo, setExcluindo] = useState(null); // tecido aguardando confirmação

  const carregar = () =>
    api()
      .then((d) => { setTecidos(d); setErroCarga(''); })
      .catch((err) => setErroCarga(textoDoErro(err, 'Não foi possível carregar os tecidos.')))
      .finally(() => setCarregando(false));

  useEffect(() => { carregar(); }, []);

  const lista = useMemo(
    () =>
      tecidos.filter(
        (t) =>
          t.nm_tecido.toLowerCase().includes(busca.toLowerCase()) &&
          (!soAcabando || acabando(t))
      ),
    [tecidos, busca, soAcabando]
  );

  const valorEmEstoque = tecidos.reduce((s, t) => s + t.nr_metragem_atual * t.vl_metro, 0);
  const qtdAcabando = tecidos.filter(acabando).length;

  // Devolve true se salvou, para quem chamou decidir o que avisar
  async function salvar(dados, id, mensagem) {
    try {
      await api(id ? `${API}/${id}` : API, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(dados),
      });
      setModal(null);
      toast.success(mensagem);
      carregar();
      return true;
    } catch (err) {
      toast.error(textoDoErro(err, 'Não foi possível salvar. Tente de novo.'));
      return false;
    }
  }

  const salvarForm = (dados, id) =>
    salvar(dados, id, id ? 'Tecido atualizado.' : 'Tecido cadastrado.');

  async function registrarUso(t, m) {
    const novoAtual = Number(t.nr_metragem_atual) - m;
    const ok = await salvar(
      { ...t, nr_metragem_atual: novoAtual },
      t.cd_tecido,
      `Uso registrado: ${metros(m)} de ${t.nm_tecido}.`
    );
    if (ok && minimo(t) > 0 && novoAtual <= minimo(t)) {
      toast.warning(`${t.nm_tecido} chegou ao estoque mínimo. Restam ${metros(novoAtual)}.`);
    }
  }

  const repor = (t, m) =>
    salvar(
      {
        ...t,
        nr_metragem_atual: Number(t.nr_metragem_atual) + m,
        nr_metragem_inicial: Number(t.nr_metragem_inicial) + m,
      },
      t.cd_tecido,
      `${metros(m)} adicionados em ${t.nm_tecido}.`
    );

  async function confirmarExclusao() {
    const t = excluindo;
    try {
      await api(`${API}/${t.cd_tecido}`, { method: 'DELETE' });
      toast.success(`${t.nm_tecido} foi excluído.`);
      carregar();
    } catch (err) {
      toast.error(textoDoErro(err, 'Não foi possível excluir o tecido.'));
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <div className="ateliê">
      <style>{css}</style>
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'inherit' } }} />

      <header className="topo">
        <div>
          <h1>Meus tecidos</h1>
          <p className="total">
            {tecidos.length} {tecidos.length === 1 ? 'tecido' : 'tecidos'} · {brl(valorEmEstoque)} em estoque
            {qtdAcabando > 0 && ` · ${qtdAcabando} acabando`}
          </p>
        </div>
        <button className="btn principal" onClick={() => setModal({ tipo: 'tecido' })}>
          Novo tecido
        </button>
      </header>

      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar tecido"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <label className="check">
          <input type="checkbox" checked={soAcabando} onChange={(e) => setSoAcabando(e.target.checked)} />
          Só os que estão acabando
        </label>
      </div>

      {erroCarga && (
        <div className="falha" role="alert">
          <p>{erroCarga}</p>
          <button className="btn" onClick={() => { setCarregando(true); carregar(); }}>Tentar de novo</button>
        </div>
      )}
      {carregando && <p className="vazio">Carregando tecidos…</p>}
      {!carregando && !erroCarga && lista.length === 0 && (
        <p className="vazio">
          {tecidos.length === 0
            ? 'Nenhum tecido cadastrado. Clique em "Novo tecido" para começar.'
            : soAcabando
              ? 'Nenhum tecido está no estoque mínimo.'
              : 'Nenhum tecido encontrado com essa busca.'}
        </p>
      )}

      <div className="grade">
        {lista.map((t) => {
          const p = pct(t);
          const gasto = Number(t.nr_metragem_inicial) - Number(t.nr_metragem_atual);
          const marcaMin = minimo(t) > 0 && Number(t.nr_metragem_inicial) > 0
            ? Math.min(100, (minimo(t) / t.nr_metragem_inicial) * 100)
            : null;
          return (
            <article className="tecido" key={t.cd_tecido}>
              <div className="cab">
                <span className="amostra" style={{ background: t.ds_cor || '#23224a' }} />
                <h2>{t.nm_tecido}</h2>
                {acabando(t) && <span className="aviso">Acabando</span>}
              </div>

              <div className="fita" role="img" aria-label={`${Math.round(p)}% restante`}>
                <div className="fita-fill" style={{ width: `${p}%`, background: t.ds_cor || '#23224a' }} />
                {marcaMin !== null && <span className="marca" style={{ left: `${marcaMin}%` }} title="Estoque mínimo" />}
              </div>
              <div className="fita-legenda">
                <strong>{metros(t.nr_metragem_atual)}</strong>
                <span>de {metros(t.nr_metragem_inicial)}</span>
              </div>
              <p className="minimo">
                {minimo(t) > 0 ? `Estoque mínimo: ${metros(minimo(t))}` : 'Sem estoque mínimo definido'}
              </p>

              <dl className="dados">
                <div><dt>Preço por metro</dt><dd>{brl(t.vl_metro)}</dd></div>
                <div><dt>Restante vale</dt><dd>{brl(t.nr_metragem_atual * t.vl_metro)}</dd></div>
                <div><dt>Já usado</dt><dd>{metros(gasto)}</dd></div>
                <div><dt>Gasto até agora</dt><dd>{brl(gasto * t.vl_metro)}</dd></div>
              </dl>

              <div className="acoes">
                <button className="btn" onClick={() => setModal({ tipo: 'uso', tecido: t })}>Registrar uso</button>
                <button className="btn" onClick={() => setModal({ tipo: 'repor', tecido: t })}>Repor</button>
                <button className="btn leve" onClick={() => setModal({ tipo: 'tecido', tecido: t })}>Editar</button>
                <button className="btn leve perigo" onClick={() => setExcluindo(t)}>Excluir</button>
              </div>
            </article>
          );
        })}
      </div>

      {modal?.tipo === 'tecido' && (
        <FormTecido tecido={modal.tecido} onSalvar={salvarForm} onFechar={() => setModal(null)} />
      )}
      {modal?.tipo === 'uso' && (
        <FormMetros
          titulo={`Registrar uso · ${modal.tecido.nm_tecido}`}
          rotulo="Metros usados"
          max={Number(modal.tecido.nr_metragem_atual)}
          acao="Registrar uso"
          onConfirmar={(m) => registrarUso(modal.tecido, m)}
          onFechar={() => setModal(null)}
        />
      )}
      {modal?.tipo === 'repor' && (
        <FormMetros
          titulo={`Repor estoque · ${modal.tecido.nm_tecido}`}
          rotulo="Metros comprados"
          acao="Adicionar ao estoque"
          onConfirmar={(m) => repor(modal.tecido, m)}
          onFechar={() => setModal(null)}
        />
      )}
      {excluindo && (
        <Modal titulo="Excluir tecido?" onFechar={() => setExcluindo(null)}>
          <p className="texto">
            "{excluindo.nm_tecido}" será removido do estoque. Essa ação não pode ser desfeita.
          </p>
          <div className="acoes fim">
            <button className="btn leve" onClick={() => setExcluindo(null)}>Cancelar</button>
            <button className="btn principal perigo" onClick={confirmarExclusao} autoFocus>Excluir tecido</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ titulo, onFechar, children }) {
  useEffect(() => {
    const fechar = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [onFechar]);

  return (
    <div className="fundo" onClick={onFechar}>
      <div className="modal" role="dialog" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

function FormTecido({ tecido, onSalvar, onFechar }) {
  const [nome, setNome] = useState(tecido?.nm_tecido || '');
  const [cor, setCor] = useState(tecido?.ds_cor || '#23224a');
  const [preco, setPreco] = useState(tecido?.vl_metro ?? '');
  const [metragem, setMetragem] = useState(tecido?.nr_metragem_atual ?? '');
  const [min, setMin] = useState(tecido?.nr_metragem_minima || '');

  const valido =
    nome.trim() && preco !== '' && Number(preco) >= 0 && Number(metragem) > 0 && Number(min || 0) >= 0;

  function enviar(e) {
    e.preventDefault();
    if (!valido) return;
    const atual = Number(metragem);
    onSalvar(
      {
        nm_tecido: nome.trim(),
        ds_cor: cor,
        vl_metro: Number(preco),
        nr_metragem_atual: atual,
        nr_metragem_inicial: tecido ? Math.max(Number(tecido.nr_metragem_inicial), atual) : atual,
        nr_metragem_minima: Number(min || 0),
      },
      tecido?.cd_tecido
    );
  }

  return (
    <Modal titulo={tecido ? 'Editar tecido' : 'Novo tecido'} onFechar={onFechar}>
      <form onSubmit={enviar}>
        <label>Nome do tecido
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Linho azul-marinho" autoFocus />
        </label>
        <label>Cor
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} />
        </label>
        <label>Preço por metro (R$)
          <input type="number" min="0" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </label>
        <label>{tecido ? 'Metros restantes' : 'Metros comprados'}
          <input type="number" min="0" step="0.01" value={metragem} onChange={(e) => setMetragem(e.target.value)} />
        </label>
        <label>Estoque mínimo (metros)
          <input type="number" min="0" step="0.01" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Ex.: 2" />
          <span className="dica">Quando restar essa metragem ou menos, o tecido aparece como "Acabando". Deixe vazio para não avisar.</span>
        </label>
        <div className="acoes fim">
          <button type="button" className="btn leve" onClick={onFechar}>Cancelar</button>
          <button className="btn principal" disabled={!valido}>Salvar tecido</button>
        </div>
      </form>
    </Modal>
  );
}

function FormMetros({ titulo, rotulo, max, acao, onConfirmar, onFechar }) {
  const [valor, setValor] = useState('');
  const n = Number(valor);
  const valido = n > 0 && (max === undefined || n <= max);

  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <form onSubmit={(e) => { e.preventDefault(); if (valido) onConfirmar(n); }}>
        <label>{rotulo}
          <input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} autoFocus />
        </label>
        {max !== undefined && n > max && <p className="erro">Só restam {metros(max)} desse tecido.</p>}
        <div className="acoes fim">
          <button type="button" className="btn leve" onClick={onFechar}>Cancelar</button>
          <button className="btn principal" disabled={!valido}>{acao}</button>
        </div>
      </form>
    </Modal>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&display=swap');
.ateliê{--tinta:#23224a;--papel:#eeedf3;--cartao:#fbfbfd;--linha:#d6d4e0;--suave:#6b6a85;--alerta:#b3261e;
  min-height:100vh;background:var(--papel);color:var(--tinta);padding:32px clamp(16px,4vw,48px);
  font-family:'Bricolage Grotesque',system-ui,sans-serif;box-sizing:border-box}
.ateliê *{box-sizing:border-box}
.topo{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:24px}
h1{margin:0;font-size:clamp(32px,6vw,52px);font-weight:800;letter-spacing:-.03em;line-height:1}
.total{margin:8px 0 0;color:var(--suave);font-size:16px}
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
  background:transparent;color:var(--tinta);cursor:pointer}
.btn:hover{background:rgba(35,34,74,.07)}
.btn.principal{background:var(--tinta);color:#fff}
.btn.principal:hover{background:#34336a}
.btn.principal:disabled{opacity:.4;cursor:not-allowed}
.btn.principal.perigo{background:var(--alerta);border-color:var(--alerta);color:#fff}
.btn.principal.perigo:hover{background:#8f1d17}
.btn.leve{border-color:transparent;color:var(--suave)}
.btn.leve.perigo:hover{color:var(--alerta)}
.btn:focus-visible,input:focus-visible{outline:3px solid #7f7cd6;outline-offset:2px}
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
@media (prefers-reduced-motion:reduce){.fita-fill{transition:none}}
`;