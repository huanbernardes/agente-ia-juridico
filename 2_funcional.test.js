// TESTE 2 — FUNCIONAL: Rota /chat
// Rodar: npx jest 2_funcional --verbose

const request = require("supertest");
const app = require("./server");

describe("Teste Funcional - Rota /chat", () => {

  it("TF-001 | POST /chat deve retornar 200 com reply e sessionId", async () => {
    const res = await request(app).post("/chat").send({ message: "Ola, tudo bem?" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reply");
    expect(res.body).toHaveProperty("sessionId");
  }, 15000);

  it("TF-002 | POST /chat deve manter contexto com mesmo sessionId", async () => {
    const first = await request(app).post("/chat").send({ message: "Meu nome e Joao" });
    const sessionId = first.body.sessionId;
    const second = await request(app).post("/chat").send({ message: "Qual e meu nome?", sessionId });
    expect(second.status).toBe(200);
    expect(second.body.sessionId).toBe(sessionId);
  }, 15000);

  it("TF-003 | POST /chat sem message nao deve retornar 500", async () => {
    const res = await request(app).post("/chat").send({});
    expect(res.status).not.toBe(500);
  }, 15000);
});