import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { API_IMPORTAR,API_DRIVE, API_SAIR, api, baixarBackup, dataHora, metros, textoDoErro } from './lib.js';

export function Modal({ titulo, onFechar, children }) {
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

// ---- Cores -------------------------------------------------------------

// Aceita "#ff5733", "ff5733" ou "f53". Devolve "#RRGGBB" ou null se for inválido.
function normalizarHex(texto) {
  let h = String(texto).trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(h) ? `#${h.toUpperCase()}` : null;
}

const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

function hexParaHsv(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvParaHex({ h, s, v }) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const p = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${p(f(5))}${p(f(3))}${p(f(1))}`.toUpperCase();
}

const CORES_PRONTAS = [
  '#23224A', '#7F7CD6', '#B3261E', '#E07A5F', '#F2CC8F', '#81B29A',
  '#1B6B3A', '#3D405B', '#8A5A00', '#F4F1DE', '#FFFFFF', '#000000',
];

function SeletorCor({ valor, onChange }) {
  const [aberto, setAberto] = useState(false);
  const [hsv, setHsv] = useState(() => hexParaHsv(valor));
  const [texto, setTexto] = useState(valor.toUpperCase());
  const raiz = useRef(null);

  // Fecha o painel ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (!raiz.current?.contains(e.target)) setAberto(false); };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  function aplicar(novo) {
    const hex = hsvParaHex(novo);
    setHsv(novo);
    setTexto(hex);
    onChange(hex);
  }

  function digitar(e) {
    setTexto(e.target.value);
    const hex = normalizarHex(e.target.value);
    if (hex) {
      setHsv(hexParaHsv(hex));
      onChange(hex);
    }
  }

  function moverArea(e) {
    const r = e.currentTarget.getBoundingClientRect();
    aplicar({
      h: hsv.h,
      s: limitar((e.clientX - r.left) / r.width, 0, 1),
      v: 1 - limitar((e.clientY - r.top) / r.height, 0, 1),
    });
  }

  // Esc fecha só o painel (sem fechar o modal inteiro)
  function teclas(e) {
    if (e.key === 'Escape' && aberto) {
      e.stopPropagation();
      setAberto(false);
    }
  }

  return (
    <div className="campo" ref={raiz} onKeyDown={teclas}>
      <span className="rotulo" id="rotulo-cor">Cor</span>
      <div className="cor-linha">
        <button
          type="button"
          className="cor-botao"
          style={{ background: valor }}
          onClick={() => setAberto((v) => !v)}
          aria-labelledby="rotulo-cor"
          aria-expanded={aberto}
          title="Escolher cor"
        />
        <input
          className="hex-campo"
          type="text"
          aria-label="Código hexadecimal da cor"
          value={texto}
          placeholder="#23224A"
          spellCheck={false}
          autoComplete="off"
          onChange={digitar}
          onBlur={() => setTexto(valor.toUpperCase())}
        />
      </div>
      {normalizarHex(texto) === null && (
        <p className="erro">Use o formato #RRGGBB, por exemplo #23224A.</p>
      )}

      {aberto && (
        <div className="cor-painel">
          <div
            className="sv"
            style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); moverArea(e); }}
            onPointerMove={(e) => { if (e.buttons === 1) moverArea(e); }}
          >
            <span
              className="sv-ponto"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: valor }}
            />
          </div>

          <input
            className="matiz"
            type="range"
            min="0"
            max="360"
            value={Math.round(hsv.h)}
            aria-label="Matiz"
            onChange={(e) => aplicar({ ...hsv, h: Number(e.target.value) })}
          />

          <div className="amostras">
            {CORES_PRONTAS.map((c) => (
              <button
                type="button"
                key={c}
                className={c === valor.toUpperCase() ? 'ativa' : ''}
                style={{ background: c }}
                aria-label={`Usar ${c}`}
                title={c}
                onClick={() => aplicar(hexParaHsv(c))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Formulários -------------------------------------------------------

export function FormTecido({ tecido, onSalvar, onFechar }) {
  const [nome, setNome] = useState(tecido?.nm_tecido || '');
  const [cor, setCor] = useState((tecido?.ds_cor || '#23224a').toUpperCase());
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
        <SeletorCor valor={cor} onChange={setCor} />
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

export function FormMetros({ titulo, rotulo, max, acao, onConfirmar, onFechar }) {
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

// ---- Menu de configurações (engrenagem) --------------------------------

const icone = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const IconeEngrenagem = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...icone}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconeBaixar = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...icone}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
  </svg>
);
const IconeEnviar = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...icone}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
  </svg>
);
const IconeSair = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...icone}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><path d="M12 2v10" />
  </svg>
);

const IconeNuvem = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...icone}>
  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

export function MenuConfig({ onImportado }) {
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState(null); // { nome, dados }
  const [importando, setImportando] = useState(false);
  const [confirmaSaida, setConfirmaSaida] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [encerrado, setEncerrado] = useState(false);
  const raiz = useRef(null);
  const entrada = useRef(null);
  const [drive, setDrive] = useState(null);          // { configurado, conectado, email }
  const [modalBackup, setModalBackup] = useState(false);
  const [enviandoBackup, setEnviandoBackup] = useState(false);
  const [modalDrive, setModalDrive] = useState(false);
  const [destino, setDestino] = useState('local'); // 'local' | 'drive'

  const carregarDrive = () =>
  api(`${API_DRIVE}/status`).then(setDrive).catch(() => setDrive(null));

  useEffect(() => { carregarDrive(); }, []);

  // Volta do login do Google: /?drive=ok ou /?drive=erro
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('drive');
    if (!r) return;
    if (r === 'ok') toast.success('Google Drive conectado.');
    else toast.error('Não foi possível conectar ao Google Drive.');
    window.history.replaceState({}, '', window.location.pathname);
  }, []);



  // Fecha o menu ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (!raiz.current?.contains(e.target)) setAberto(false); };
    const esc = (e) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      window.removeEventListener('keydown', esc);
    };
  }, [aberto]);

function abrirBackup() {
  setAberto(false);
  setDestino('local');
  setModalBackup(true);
  carregarDrive()            // sem Drive conectado, comporta-se como antes
}

async function confirmarBackup() {
  setEnviandoBackup(true);
  try {
    if (destino === 'drive') {
      const r = await api(`${API_DRIVE}/backup`, { method: 'POST', body: JSON.stringify({ tipo: 'manual' }) });
      toast.success(`Backup enviado ao Google Drive: ${r.nome}`);
    } else {
      await baixarBackup('manual');
      toast.success('Backup gerado. Procure o arquivo na pasta Downloads.');
    }
    setModalBackup(false);
  } catch (err) {
    toast.error(textoDoErro(err, 'Não foi possível fazer o backup.'));
  } finally {
    setEnviandoBackup(false);
  }
}


async function confirmarBackup() {
  setEnviandoBackup(true);
  try {
    if (destino === 'drive') {
      const r = await api(`${API_DRIVE}/backup`, { method: 'POST', body: JSON.stringify({ tipo: 'manual' }) });
      toast.success(`Backup enviado ao Google Drive: ${r.nome}`);
    } else {
      await baixarBackup('manual');
      toast.success('Backup gerado. Procure o arquivo na pasta Downloads.');
    }
    setModalBackup(false);
  } catch (err) {
    toast.error(textoDoErro(err, 'Não foi possível fazer o backup.'));
  } finally {
    setEnviandoBackup(false);
  }
}

async function conectarDrive() {
  try {
    const { url } = await api(`${API_DRIVE}/conectar`);
    window.location.href = url;
  } catch (err) {
    toast.error(textoDoErro(err, 'Não foi possível iniciar a conexão.'));
  }
}

async function desconectarDrive() {
  try {
    await api(`${API_DRIVE}/desconectar`, { method: 'POST' });
    await carregarDrive();
    toast.success('Google Drive desconectado.');
  } catch (err) {
    toast.error(textoDoErro(err, 'Não foi possível desconectar.'));
  }
}

  function abrirSeletor() {
    setAberto(false);
    entrada.current.click();
  }

  async function escolher(e) {
    const f = e.target.files[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!f) return;
    try {
      const dados = JSON.parse(await f.text());
      if (dados?.app !== 'meus-tecidos' || !Array.isArray(dados.tabelas?.tecido)
          || !Array.isArray(dados.tabelas?.movimentacao)) throw new Error();
      setArquivo({ nome: f.name, dados });
    } catch {
      toast.error('Esse arquivo não é um backup válido do Meus Tecidos.');
    }
  }

  async function confirmarImportacao() {
    setImportando(true);
    try {
      await baixarBackup('seguranca'); // segurança: guarda o estado atual antes de substituir
      await api(API_IMPORTAR, { method: 'POST', body: JSON.stringify(arquivo.dados) });
      toast.success('Backup importado com sucesso.');
      setArquivo(null);
      onImportado();
    } catch (err) {
      toast.error(textoDoErro(err, 'Não foi possível importar o backup.'));
    } finally {
      setImportando(false);
    }
  }

  async function sair() {
    setSaindo(true);
    try {
      await api(API_SAIR, { method: 'POST' });
    } catch (err) {
      // Servidor já fora do ar (TypeError) conta como encerrado
      if (!(err instanceof TypeError)) {
        toast.error(textoDoErro(err, 'Não foi possível encerrar o sistema.'));
        setSaindo(false);
        return;
      }
    }
    setConfirmaSaida(false);
    setEncerrado(true);
    window.close(); // fecha a janela do app; se o navegador não permitir, a tela abaixo avisa
  }

  return (
    <div className="config" ref={raiz}>
      <button
        className={`engrenagem${aberto ? ' aberta' : ''}`}
        onClick={() => setAberto((v) => !v)}
        aria-label="Configurações"
        aria-haspopup="menu"
        aria-expanded={aberto}
        title="Configurações"
      >
        <IconeEngrenagem />
      </button>

      {aberto && (
        <div className="menu" role="menu">
          <button className="item" role="menuitem" onClick={abrirBackup}>
            <span className="item-icone"><IconeBaixar /></span>
            <span className="item-texto">
              <strong>Fazer backup</strong>
              <small>Salvar tudo em um arquivo</small>
            </span>
          </button>
          <button className="item" role="menuitem" onClick={abrirSeletor}>
            <span className="item-icone"><IconeEnviar /></span>
            <span className="item-texto">
              <strong>Importar backup</strong>
              <small>Restaurar de um arquivo</small>
            </span>
          </button>
          <button className="item" role="menuitem" onClick={() => { setAberto(false); setModalDrive(true); }}>
            <span className="item-icone"><IconeNuvem /></span>
            <span className="item-texto">
              <strong>Google Drive</strong>
              <small>{drive?.conectado ? `Conectado: ${drive.email}` : 'Não conectado'}</small>
            </span>
          </button>
          <hr className="menu-linha" />
          <button
            className="item perigo"
            role="menuitem"
            onClick={() => { setAberto(false); setConfirmaSaida(true); }}
          >
            <span className="item-icone"><IconeSair /></span>
            <span className="item-texto">
              <strong>Sair do sistema</strong>
              <small>Fecha o programa por completo</small>
            </span>
          </button>
        </div>
      )}

      <input ref={entrada} type="file" accept=".json,application/json" hidden onChange={escolher} />

      {arquivo && (
        <Modal titulo="Importar backup?" onFechar={() => !importando && setArquivo(null)}>
          <p className="texto">
            <strong>{arquivo.nome}</strong><br />
            {arquivo.dados.tabelas.tecido.length} tecidos e {arquivo.dados.tabelas.movimentacao.length} movimentações
            {arquivo.dados.geradoEm && ` · gerado em ${dataHora(arquivo.dados.geradoEm)}`}
          </p>
          <p className="texto">
            Isso <strong>substitui todos os dados atuais</strong>. Antes de importar, um backup do estado atual é baixado automaticamente.
          </p>
          <div className="acoes fim">
            <button className="btn leve" disabled={importando} onClick={() => setArquivo(null)}>Cancelar</button>
            <button className="btn principal perigo" disabled={importando} onClick={confirmarImportacao}>
              {importando ? 'Importando…' : 'Substituir e importar'}
            </button>
          </div>
        </Modal>
      )}

      {confirmaSaida && (
        <Modal titulo="Sair do sistema?" onFechar={() => !saindo && setConfirmaSaida(false)}>
          <p className="texto">O programa será encerrado por completo. Para usar de novo, é só abrir o atalho.</p>
          <div className="acoes fim">
            <button className="btn leve" disabled={saindo} onClick={() => setConfirmaSaida(false)}>Cancelar</button>
            <button className="btn principal perigo" disabled={saindo} onClick={sair} autoFocus>
              {saindo ? 'Encerrando…' : 'Sair'}
            </button>
          </div>
        </Modal>
      )}

      {encerrado && (
        <div className="encerrado" role="status">
          <h2>Sistema encerrado</h2>
          <p>Pode fechar esta janela.</p>
        </div>
      )}
      {modalBackup && (() => {
        const driveOk = Boolean(drive?.conectado);
        return (
          <Modal titulo="Fazer backup" onFechar={() => !enviandoBackup && setModalBackup(false)}>
            <div className="opcoes">
              <label className={`opcao${destino === 'local' ? ' marcada' : ''}`}>
                <input
                  type="radio"
                  name="destino-backup"
                  checked={destino === 'local'}
                  onChange={() => setDestino('local')}
                />
                <span>
                  <strong>Baixar no computador</strong>
                  <small>Salva na pasta Downloads.</small>
                </span>
              </label>

              <label className={`opcao${destino === 'drive' ? ' marcada' : ''}${driveOk ? '' : ' desativada'}`}>
                <input
                  type="radio"
                  name="destino-backup"
                  checked={destino === 'drive'}
                  disabled={!driveOk}
                  onChange={() => setDestino('drive')}
                />
                <span>
                  <strong>Enviar para o Google Drive</strong>
                  <small>{driveOk ? `Conta: ${drive.email}` : 'Indisponível: conta não conectada.'}</small>
                </span>
              </label>
            </div>

            {!driveOk && (
              <p className="aviso-drive">
                Para usar o Drive, conecte sua conta em <strong>Configurações (⚙) → Google Drive</strong>.{' '}
                <button
                  type="button"
                  className="link"
                  onClick={() => { setModalBackup(false); setModalDrive(true); }}
                >
                  Abrir agora
                </button>
              </p>
            )}

            <div className="acoes fim">
              <button className="btn leve" disabled={enviandoBackup} onClick={() => setModalBackup(false)}>Cancelar</button>
              <button className="btn principal" disabled={enviandoBackup} onClick={confirmarBackup} autoFocus>
                {enviandoBackup ? 'Enviando…' : 'Fazer backup'}
              </button>
            </div>
          </Modal>
        );
      })()}

      {modalDrive && (
        <Modal titulo="Google Drive" onFechar={() => setModalDrive(false)}>
          {drive?.conectado ? (
            <p className="texto">Conectado como <strong>{drive.email}</strong>. Os backups vão para a pasta "Meus Tecidos - Backups".</p>
          ) : (
            <p className="texto">Conecte sua conta para poder enviar os backups direto para o Drive.</p>
          )}
          <div className="acoes fim">
            <button className="btn leve" onClick={() => setModalDrive(false)}>Fechar</button>
            {drive?.conectado
              ? <button className="btn principal perigo" onClick={desconectarDrive}>Desconectar</button>
              : <button className="btn principal" onClick={conectarDrive}>Conectar conta Google</button>}
          </div>
        </Modal>
      )}
    </div>
    
  );
}