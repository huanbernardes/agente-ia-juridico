import { useState, useEffect, useRef } from "react";
import "./App.css";

const API_URL = "http://localhost:3001";

const SUGESTOES = [
  "Meu chefe não quer pagar horas extras, tenho direito?",
  "Comprei um produto com defeito, e agora?",
  "O que é violência doméstica pela lei?",
  "Quais são meus direitos como consumidor?",
  "Fui vítima de roubo, o que fazer?",
  "Fui vítima de estelionato, o que fazer?",
];

export default function App() {
  type ChatMessage = {
  role: string;
  text: string;
};
  const [message, setMessage]   = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [iniciou, setIniciou]   = useState(false);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  // Scroll automático
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat, loading]);

  // Inicia conversa automaticamente
  useEffect(() => {
    if (!iniciou) {
      setIniciou(true);
      iniciarConversa();
    }
  }, []);

  const iniciarConversa = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "olá" }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setChat([{ role: "assistant", text: data.reply }]);
    } catch {
      setChat([{ 
        role: "assistant", 
        text: "Olá! Tudo bem? Sou a Dra. Lexa, assistente jurídica virtual. Como posso te ajudar?" 
      }
    ]);
    }
    setLoading(false);
  };

  const enviar = async (texto?: string) => {
    const msg = texto || message;
    if (!msg.trim() || loading) return;

    setMessage("");
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setChat(prev => [...prev, { role: "user", text: msg }]);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setChat(prev => [...prev, {
        role: "assistant",
        text: data.reply || data.error
      }]);
    } catch {
      setChat(prev => [...prev, {
        role: "assistant",
        text: "Erro ao conectar. Verifique se o servidor está rodando."
      }]);
    }
    setLoading(false);
  };

  const novaConversa = () => {
    setSessionId(null);
    setChat([]);
    iniciarConversa();
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚖️</span>
          <div>
            <div className="logo-nome">Assistente Jurídico Virtual</div>
            <div className="logo-sub">Dra. Lexa IA jurídica</div>
          </div>
        </div>

        <button className="btn-nova" onClick={novaConversa}>
          + Nova consulta
        </button>

        <div className="sidebar-section">Perguntas frequentes</div>
        {SUGESTOES.map((s, i) => (
          <button key={i} className="sugestao-btn" onClick={() => enviar(s)} disabled={loading}>
            {s}
          </button>
        ))}

        <div className="sidebar-footer">
          <div className="aviso-legal">
            As orientações fornecidas são de caráter educativo e não substituem a consultoria de um advogado habilitado.
          </div>
        </div>
      </aside>

      {/* CHAT PRINCIPAL */}
      <main className="chat-main">

        {/* HEADER */}
        <div className="chat-header">
          <div className="dra-info">
            <div className="dra-avatar">⚖️</div>
            <div>
              <div className="dra-nome">Dra. Lexa</div>
              <div className="dra-status">
                <span className="status-dot"></span> Online
              </div>
            </div>
          </div>
        </div>

        {/* MENSAGENS */}
        <div className="chat-box" ref={chatBoxRef}>
          {chat.map((msg, i) => (
            <div key={i} className={`msg-wrapper ${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="msg-avatar">⚖️</div>
              )}
              <div className={`msg-bubble ${msg.role}`}>
                {msg.text.split("\n").map((linha, j) => (
                  <span key={j}>{linha}{j < msg.text.split("\n").length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-wrapper assistant">
              <div className="msg-avatar">⚖️</div>
              <div className="msg-bubble assistant typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="chat-input-area">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Descreva sua dúvida jurídica... (Enter para enviar)"
            disabled={loading}
            rows={2}
            maxLength={1000}
          />
          <button
            onClick={() => enviar()}
            disabled={loading || !message.trim()}
            className="btn-enviar"
          >
            ➤
          </button>
        </div>
        <div className="input-hint">
          Enter para enviar · Shift+Enter para nova linha · {message.length}/1000
        </div>
      </main>
    </div>
  );
}
