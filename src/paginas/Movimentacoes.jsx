import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API, API_MOV, ROTULO, api, brl, dataHora, metros, textoDoErro } from '../lib.js';

// O tecido filtrado fica na URL: /movimentacoes?tecido=ID
export default function Movimentacoes() {
  const [params, setParams] = useSearchParams();
  const tecidoId = params.get('tecido') || '';

  const [tecidos, setTecidos] = useState([]);
  const [movs, setMovs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Lista de tecidos para o seletor (a página funciona sozinha, sem depender do estoque)
  useEffect(() => {
    api(API).then(setTecidos).catch(() => {});
  }, []);

  useEffect(() => {
    setCarregando(true);
    api(tecidoId ? `${API_MOV}?cd_tecido=${tecidoId}` : API_MOV)
      .then((d) => { setMovs(d); setErro(''); })
      .catch((err) => setErro(textoDoErro(err, 'Não foi possível carregar o histórico.')))
      .finally(() => setCarregando(false));
  }, [tecidoId]);

  const trocarTecido = (id) => setParams(id ? { tecido: id } : {});

  return (
    <section>
      <div className="filtros">
        <label className="check">
          Tecido
          <select className="seletor" value={tecidoId} onChange={(e) => trocarTecido(e.target.value)}>
            <option value="">Todos os tecidos</option>
            {tecidos.map((t) => (
              <option key={t.cd_tecido} value={t.cd_tecido}>{t.nm_tecido}</option>
            ))}
          </select>
        </label>
      </div>

      {erro && <div className="falha" role="alert"><p>{erro}</p></div>}
      {carregando && <p className="vazio">Carregando histórico…</p>}
      {!carregando && !erro && movs.length === 0 && (
        <p className="vazio">Nenhuma movimentação registrada ainda.</p>
      )}

      <ul className="historico">
        {movs.map((m) => (
          <li key={m.cd_movimentacao} className="mov">
            <div className="mov-info">
              <span className={`tipo ${m.tp_movimentacao.toLowerCase()}`}>{ROTULO[m.tp_movimentacao]}</span>
              <strong>{m.nm_tecido}</strong>
              <span className="mov-data">{dataHora(m.dt_movimentacao)}</span>
            </div>
            <div className="mov-nums">
              <span className={m.nr_metros < 0 ? 'neg' : 'pos'}>
                {m.nr_metros > 0 ? '+' : ''}{metros(m.nr_metros)}
              </span>
              <span className="mov-data">
                {metros(m.nr_metragem_anterior)} → {metros(m.nr_metragem_posterior)}
                {m.nr_metros !== 0 && ` · ${brl(Math.abs(m.nr_metros) * m.vl_metro)}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
