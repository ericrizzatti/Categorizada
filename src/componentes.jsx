import { useEffect, useState } from 'react';
import { metros } from './lib.js';

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

export function FormTecido({ tecido, onSalvar, onFechar }) {
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
