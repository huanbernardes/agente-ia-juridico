// TESTE 1 — UNITÁRIO: Tools do Agente
// Rodar: npx jest 1_unitario --verbose

describe("Teste Unitario - Tools do Agente", () => {

  const tools = {
    getTime: () => new Date().toLocaleString(),
    calculate: (expression) => {
      try { return eval(expression).toString(); }
      catch { return "Erro ao calcular"; }
    }
  };

  it("TU-001 | getTime deve retornar string nao vazia", () => {
    const resultado = tools.getTime();
    expect(typeof resultado).toBe("string");
    expect(resultado.length).toBeGreaterThan(0);
  });

  it("TU-002 | calculate deve retornar resultado correto para expressao valida", () => {
    expect(tools.calculate("2 + 2")).toBe("4");
  });

  it("TU-003 | calculate deve retornar erro para expressao invalida", () => {
    expect(tools.calculate("abc + 123")).toBe("Erro ao calcular");
  });

  it("TU-004 | server.js deve ser importavel sem erros (valida bugs de importacao)", () => {
    expect(() => require("./server")).not.toThrow();
  });
});