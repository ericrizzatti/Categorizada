import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { API, api, brl, metros, textoDoErro, minimo, acabando, pct } from '../lib.js';
import { Modal, FormTecido, FormMetros } from '../componentes.jsx';

export default function Estoque() {
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
      { ...t, nr_metragem_atual: novoAtual, tp_movimentacao: 'USO' },
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
        tp_movimentacao: 'REPOSICAO',
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
    <>
      <div className="barra">
        <p className="total">
          {tecidos.length} {tecidos.length === 1 ? 'tecido' : 'tecidos'} · {brl(valorEmEstoque)} em estoque
          {qtdAcabando > 0 && ` · ${qtdAcabando} acabando`}
        </p>
        <button className="btn principal" onClick={() => setModal({ tipo: 'tecido' })}>Novo tecido</button>
      </div>

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
                <Link className="btn leve" to={`/movimentacoes?tecido=${t.cd_tecido}`}>Histórico</Link>
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
    </>
  );
}
