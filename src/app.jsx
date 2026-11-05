import { useEffect } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { API_BASE } from './lib.js';
import { css } from './estilos.js';
import Estoque from './paginas/Estoque.jsx';
import Movimentacoes from './paginas/Movimentacoes.jsx';

const ID_ABA = Math.random().toString(36).slice(2); // identifica esta aba para o servidor

// O App não cria o roteador (isso é feito no main.jsx),
// assim os testes podem envolvê-lo com MemoryRouter em qualquer rota.
export default function App() {
  // Avisa o servidor que esta aba está aberta (e quando fecha),
  // para ele se encerrar sozinho quando a última aba for fechada
  useEffect(() => {
    const ping = () =>
      fetch(`${API_BASE}/ping?id=${ID_ABA}`, { method: 'POST', keepalive: true }).catch(() => {});
    const sair = () => navigator.sendBeacon(`${API_BASE}/saindo?id=${ID_ABA}`);

    ping();
    const timer = setInterval(ping, 5000);
    window.addEventListener('pagehide', sair);
    window.addEventListener('pageshow', ping);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', sair);
      window.removeEventListener('pageshow', ping);
    };
  }, []);

  return (
    <div className="ateliê">
      <style>{css}</style>
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'inherit' } }} />

      <header className="topo">
        <h1>Meus tecidos</h1>
        <nav className="abas" aria-label="Seções">
          <NavLink to="/" end>Estoque</NavLink>
          <NavLink to="/movimentacoes">Movimentações</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Estoque />} />
        <Route path="/movimentacoes" element={<Movimentacoes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
