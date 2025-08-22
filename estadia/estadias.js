const API_BASE = "https://estacionamento-vercel.vercel.app"; 
let editandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-estadia");
  const listaEstadias = document.getElementById("lista-estadias");
  const entradaInput = document.getElementById("entrada");
  const valorHoraInput = document.getElementById("valorHora");
  const valorTotalInput = document.getElementById("valorTotal");
  const submitButton = document.querySelector("#form-estadia button[type='submit']");

  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  entradaInput.value = localDateTime;

  carregarVeiculos();
  buscarEstadias();

  valorHoraInput.addEventListener("input", calcularValorTotal);

  document.getElementById("btnCadastrarVeiculos").addEventListener("click", () => {
    window.location.href = "../veiculos/veiculos.html"; 
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const placa = document.getElementById("placa").value.trim();
    const entrada = new Date(entradaInput.value).toISOString();
    const valorHora = parseFloat(valorHoraInput.value);

    try {
      let url = `${API_BASE}/estadias`;
      let method = "POST";

      if (editandoId) {
        url = `${API_BASE}/estadias/${editandoId}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa, entrada, valorHora })
      });

      if (!res.ok) {
        const erro = await res.json();
        alert(erro.erro || `Erro ao ${editandoId ? 'atualizar' : 'cadastrar'} estadia`);
        return;
      }

      alert(`Estadia ${editandoId ? 'atualizada' : 'cadastrada'} com sucesso!`);
      cancelarEdicao();
      buscarEstadias();
    } catch {
      alert("Erro na conexão com o servidor");
    }
  });

  function calcularValorTotal() {
    const saida = document.getElementById("saida")?.value;
    if (!entradaInput.value || !saida || !valorHoraInput.value) {
      valorTotalInput.value = "";
      return;
    }

    const entrada = new Date(entradaInput.value);
    const dataSaida = new Date(saida);

    if (dataSaida <= entrada) {
      valorTotalInput.value = "";
      return;
    }

    const diffHoras = (dataSaida - entrada) / (1000 * 60 * 60);
    valorTotalInput.value = (diffHoras * parseFloat(valorHoraInput.value)).toFixed(2);
  }

  function cancelarEdicao() {
    editandoId = null;
    form.reset();
    entradaInput.value = localDateTime;
    valorTotalInput.value = "";
    submitButton.textContent = "Cadastrar Estadia";
  }

  async function carregarVeiculos() {
    try {
      const res = await fetch(`${API_BASE}/veiculos`);
      const veiculos = await res.json();
      const selectPlaca = document.getElementById("placa");

      while (selectPlaca.options.length > 1) selectPlaca.remove(1);

      veiculos.forEach(v => {
        const option = document.createElement("option");
        option.value = v.placa.trim();
        option.textContent = `${v.placa} - ${v.modelo} (${v.proprietario})`;
        selectPlaca.appendChild(option);
      });
    } catch {
      alert("Erro ao carregar veículos");
    }
  }

  async function buscarEstadias() {
    listaEstadias.innerHTML = "";

    try {
      const res = await fetch(`${API_BASE}/estadias`);
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const estadias = await res.json();
      window._estadias = estadias;

      if (estadias.length === 0) {
        listaEstadias.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Nenhuma estadia registrada.</td></tr>';
        return;
      }

      estadias.forEach(estadia => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${estadia.id}</td>
          <td>${estadia.placa}</td>
          <td>${formatarData(estadia.entrada)}</td>
          <td>${estadia.saida ? formatarData(estadia.saida) : "-"}</td>
          <td>R$ ${estadia.valorHora.toFixed(2)}</td>
          <td>${estadia.valorTotal ? 'R$ ' + estadia.valorTotal.toFixed(2) : "-"}</td>
          <td>
            <button class="btn-editar" onclick="editarEstadia(${estadia.id})">Editar</button>
            <button class="btn-excluir" onclick="deletarEstadia(${estadia.id})">Excluir</button>
            ${!estadia.saida ? `<button class="btn-saida" onclick="registrarSaida(${estadia.id})">Registrar Saída</button>` : ""}
          </td>
        `;
        listaEstadias.appendChild(tr);
      });
    } catch (error) {
      console.error("Erro ao buscar estadias:", error);
      listaEstadias.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:red;">Erro ao carregar estadias.</td></tr>';
    }
  }

  function formatarData(dataISO) {
    return new Date(dataISO).toLocaleString("pt-BR", {
      day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
  }

  window.editarEstadia = (id) => {
    const estadia = window._estadias.find(e => e.id === id);
    if (!estadia) { alert("Estadia não encontrada"); return; }

    document.getElementById("placa").value = estadia.placa;
    document.getElementById("entrada").value = new Date(new Date(estadia.entrada).getTime() - new Date(estadia.entrada).getTimezoneOffset()*60000).toISOString().slice(0,16);
    document.getElementById("valorHora").value = estadia.valorHora;
    document.getElementById("valorTotal").value = estadia.valorTotal || '';
    submitButton.textContent = "Atualizar Estadia";
    editandoId = id;
  };

  window.deletarEstadia = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta estadia?")) return;
    try {
      const res = await fetch(`${API_BASE}/estadias/${id}`, { method: "DELETE" });
      if (res.status === 204) {
        alert("Estadia excluída com sucesso!");
        buscarEstadias();
      } else {
        const erro = await res.json();
        alert(erro.erro || "Erro ao excluir estadia");
      }
    } catch {
      alert("Erro ao excluir estadia");
    }
  };

  window.registrarSaida = async (id) => {
    const estadia = window._estadias.find(e => e.id === id);
    if (!estadia) { alert("Estadia não encontrada"); return; }

    const saidaAtual = new Date().toISOString();
    const entrada = new Date(estadia.entrada);
    const valorTotal = ((new Date(saidaAtual) - entrada) / (1000*60*60) * estadia.valorHora).toFixed(2);

    try {
      const res = await fetch(`${API_BASE}/estadias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saida: saidaAtual, valorTotal: parseFloat(valorTotal) })
      });

      if (!res.ok) {
        const erro = await res.json();
        alert(erro.erro || "Erro ao registrar saída");
        return;
      }

      alert("Saída registrada com sucesso!");
      buscarEstadias();
    } catch {
      alert("Erro ao registrar saída");
    }
  };
});
