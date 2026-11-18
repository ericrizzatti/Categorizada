export const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&display=swap');

/* ==========================================================================
   BASE E VARIÁVEIS
   ========================================================================== */

.ateliê {
  --tinta: #23224a;
  --papel: #eeedf3;
  --cartao: #fbfbfd;
  --linha: #d6d4e0;
  --suave: #6b6a85;
  --alerta: #b3261e;

  min-height: 100vh;
  padding: 32px clamp(16px, 4vw, 48px);
  background: var(--papel);
  color: var(--tinta);
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  box-sizing: border-box;
}

.ateliê * {
  box-sizing: border-box;
}

h1 {
  margin: 0;
  font-size: clamp(32px, 6vw, 52px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}

/* ==========================================================================
   TOPO E ABAS
   ========================================================================== */

.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.abas {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #e0deea;
  border-radius: 10px;
}

.abas a {
  padding: 8px 16px;
  border-radius: 7px;
  color: var(--suave);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.abas a:hover {
  color: var(--tinta);
}

.abas a.active {
  background: var(--cartao);
  color: var(--tinta);
  box-shadow: 0 1px 2px rgba(35, 34, 74, 0.18);
}

.abas a:focus-visible {
  outline: 3px solid #7f7cd6;
  outline-offset: 2px;
}

/* ==========================================================================
   BARRA DE RESUMO E FILTROS
   ========================================================================== */

.barra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.total {
  margin: 0;
  color: var(--suave);
  font-size: 16px;
}

.filtros {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.filtros input[type=search] {
  min-width: 240px;
  padding: 10px 14px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: var(--cartao);
  color: inherit;
  font: inherit;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  cursor: pointer;
}

.seletor {
  padding: 10px 14px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: var(--cartao);
  color: inherit;
  font: inherit;
}

/* ==========================================================================
   CARTÃO DO TECIDO
   ========================================================================== */

.grade {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.tecido {
  padding: 20px;
  background: var(--cartao);
  border: 1px solid var(--linha);
  border-radius: 12px;
}

.cab {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.cab h2 {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
}

.amostra {
  flex: none;
  width: 22px;
  height: 22px;
  border: 2px solid var(--cartao);
  border-radius: 50%;
  outline: 1px solid var(--linha);
}

.aviso {
  padding: 2px 10px;
  border: 1px solid var(--alerta);
  border-radius: 99px;
  color: var(--alerta);
  font-size: 13px;
  font-weight: 600;
}

.minimo {
  margin: 0 0 16px;
  color: var(--suave);
  font-size: 13px;
}

.dados {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 0 0 18px;
  padding-top: 16px;
  border-top: 1px solid var(--linha);
}

.dados dt {
  color: var(--suave);
  font-size: 13px;
}

.dados dd {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 600;
}

/* ==========================================================================
   FITA DE METRAGEM
   ========================================================================== */

.fita {
  position: relative;
  height: 22px;
  overflow: hidden;
  border-radius: 3px;
  background-color: #e4e2ee;
  background-image: repeating-linear-gradient(
    90deg,
    transparent 0 calc(10% - 1px),
    rgba(35, 34, 74, 0.35) calc(10% - 1px) 10%
  );
}

.fita-fill {
  height: 100%;
  opacity: 0.85;
  mix-blend-mode: multiply;
  transition: width 0.4s ease;
}

.marca {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  margin-left: -1px;
  background: var(--alerta);
}

.fita-legenda {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 8px 0 4px;
  color: var(--suave);
  font-size: 14px;
}

.fita-legenda strong {
  color: var(--tinta);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* ==========================================================================
   BOTÕES
   ========================================================================== */

.acoes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.acoes.fim {
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  display: inline-block;
  padding: 9px 14px;
  border: 1px solid var(--tinta);
  border-radius: 8px;
  background: transparent;
  color: var(--tinta);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn:hover {
  background: rgba(35, 34, 74, 0.07);
}

.btn.principal {
  background: var(--tinta);
  color: #fff;
}

.btn.principal:hover {
  background: #34336a;
}

.btn.principal:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.principal.perigo {
  background: var(--alerta);
  border-color: var(--alerta);
  color: #fff;
}

.btn.principal.perigo:hover {
  background: #8f1d17;
}

.btn.leve {
  border-color: transparent;
  color: var(--suave);
}

.btn.leve.perigo:hover {
  color: var(--alerta);
}

/* ==========================================================================
   MENSAGENS (ERRO, FALHA, VAZIO)
   ========================================================================== */

.erro {
  margin: 8px 0 0;
  color: var(--alerta);
  font-size: 14px;
}

.falha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 14px 18px;
  background: #fbeceb;
  border: 1px solid #e8b9b6;
  border-radius: 10px;
}

.falha p {
  margin: 0;
  color: var(--alerta);
  font-size: 15px;
}

.vazio {
  padding: 32px 0;
  color: var(--suave);
}

/* ==========================================================================
   MODAL E FORMULÁRIOS
   ========================================================================== */

.fundo {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(35, 34, 74, 0.45);
}

.modal {
  width: 100%;
  max-width: 400px;
  max-height: 92vh;
  padding: 24px;
  overflow-y: auto;
  background: var(--cartao);
  border-radius: 12px;
}

.modal h3 {
  margin: 0 0 16px;
  font-size: 20px;
}

.modal .texto {
  margin: 0;
  color: var(--suave);
  font-size: 15px;
  line-height: 1.5;
}

.modal .texto + .texto {
  margin-top: 10px;
}

.modal label {
  display: block;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
}

.modal input:not([type=color]) {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fff;
  color: inherit;
  font: inherit;
  font-weight: 400;
}
  .opcoes {
  display: grid;
  gap: 10px;
}

.modal label.opcao {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--linha);
  border-radius: 10px;
  font-weight: 400;
  cursor: pointer;
}

.modal label.opcao.marcada {
  border-color: var(--tinta);
  background: #f3f2f8;
}

.modal label.opcao.desativada {
  background: #f3f2f8;
  opacity: 0.6;
  cursor: not-allowed;
}

.modal label.opcao input[type=radio] {
  display: inline-block;
  flex: none;
  width: 18px;
  height: 18px;
  margin: 2px 0 0;
  padding: 0;
  accent-color: var(--tinta);
  cursor: inherit;
}

.opcao strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
}

.opcao small {
  display: block;
  margin-top: 2px;
  color: var(--suave);
  font-size: 13px;
  line-height: 1.4;
}

.aviso-drive {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f3f2f8;
  color: var(--suave);
  font-size: 13px;
  line-height: 1.5;
}

.aviso-drive strong {
  color: var(--tinta);
}

.btn.link,
button.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--tinta);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.dica {
  display: block;
  margin-top: 6px;
  color: var(--suave);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
}

/* Campo de cor: botão + código HEX + painel */

.campo {
  position: relative;
  margin-bottom: 14px;
}

.campo .rotulo {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.cor-linha {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.cor-botao {
  flex: none;
  width: 56px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--linha);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.cor-botao:hover,
.cor-botao[aria-expanded=true] {
  box-shadow: 0 0 0 2px var(--suave);
}

.modal .cor-linha input.hex-campo {
  width: 120px;
  margin-top: 0;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 15px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cor-painel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 5;
  display: grid;
  gap: 12px;
  margin-top: 4px;
  padding: 12px;
  background: #fff;
  border: 1px solid var(--linha);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(35, 34, 74, 0.22);
  animation: menu-entra 0.14s ease-out;
}

.sv {
  position: relative;
  height: 140px;
  border-radius: 8px;
  background-image:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent);
  cursor: crosshair;
  touch-action: none;
}

.sv-ponto {
  position: absolute;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.modal .cor-painel input.matiz {
  width: 100%;
  height: 12px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 99px;
  background: linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.modal .cor-painel input.matiz::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid var(--tinta);
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}

.modal .cor-painel input.matiz::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid var(--tinta);
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}

.amostras {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.amostras button {
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  box-shadow: 0 0 0 1px var(--linha);
  cursor: pointer;
}

.amostras button:hover {
  box-shadow: 0 0 0 2px var(--suave);
}

.amostras button.ativa {
  box-shadow: 0 0 0 2px var(--tinta);
}
.modal input[type=color] {
  display: block;
  width: 56px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: none;
  box-shadow: 0 0 0 1px var(--linha);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.modal input[type=color]:hover {
  box-shadow: 0 0 0 2px var(--suave);
}

.modal input[type=color]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.modal input[type=color]::-webkit-color-swatch {
  border: 0;
  border-radius: 8px;
}

.modal input[type=color]::-moz-color-swatch {
  border: 0;
  border-radius: 8px;
}

.hex {
  color: var(--suave);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

/* ==========================================================================
   HISTÓRICO DE MOVIMENTAÇÕES
   ========================================================================== */

.historico {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mov {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 18px;
  background: var(--cartao);
  border: 1px solid var(--linha);
  border-radius: 10px;
}

.mov-info,
.mov-nums {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mov-nums {
  align-items: flex-end;
  font-size: 18px;
  font-weight: 800;
}

.mov-data {
  color: var(--suave);
  font-size: 13px;
  font-weight: 400;
}

.tipo {
  align-self: flex-start;
  padding: 2px 10px;
  border: 1px solid var(--linha);
  border-radius: 99px;
  color: var(--suave);
  font-size: 12px;
  font-weight: 600;
}

.tipo.uso {
  color: #8a5a00;
  border-color: #8a5a00;
}

.tipo.reposicao {
  color: #1b6b3a;
  border-color: #1b6b3a;
}

.tipo.exclusao {
  color: var(--alerta);
  border-color: var(--alerta);
}

.neg {
  color: var(--alerta);
}

.pos {
  color: #1b6b3a;
}
/* ==========================================================================
   MENU DE CONFIGURAÇÕES (ENGRENAGEM)
   ========================================================================== */

.topo-dir {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config {
  position: relative;
}

.engrenagem {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid var(--linha);
  border-radius: 10px;
  background: var(--cartao);
  color: var(--tinta);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.engrenagem:hover,
.engrenagem.aberta {
  background: #e0deea;
  border-color: var(--suave);
}

.engrenagem svg {
  transition: transform 0.4s ease;
}

.engrenagem.aberta svg {
  transform: rotate(60deg);
}

.engrenagem:focus-visible,
.item:focus-visible {
  outline: 3px solid #7f7cd6;
  outline-offset: 2px;
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 5;
  width: 270px;
  padding: 6px;
  background: var(--cartao);
  border: 1px solid var(--linha);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(35, 34, 74, 0.2);
  animation: menu-entra 0.14s ease-out;
}

@keyframes menu-entra {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--tinta);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item:hover {
  background: rgba(35, 34, 74, 0.07);
}

.item-icone {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e0deea;
}

.item-texto {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-texto strong {
  font-size: 15px;
  font-weight: 600;
}

.item-texto small {
  color: var(--suave);
  font-size: 12px;
}

.item.perigo {
  color: var(--alerta);
}

.item.perigo .item-icone {
  background: #fbeceb;
}

.item.perigo:hover {
  background: #fbeceb;
}

.menu-linha {
  height: 1px;
  margin: 6px 8px;
  border: 0;
  background: var(--linha);
}

.encerrado {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  background: var(--papel);
  text-align: center;
}

.encerrado h2 {
  margin: 0;
  font-size: 28px;
}

.encerrado p {
  margin: 0;
  color: var(--suave);
}
/* ==========================================================================
   ACESSIBILIDADE
   ========================================================================== */

.btn:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid #7f7cd6;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .fita-fill,
  .engrenagem svg {
    transition: none;
  }
  .menu,
  .cor-painel {
    animation: none;
  }
}
`;