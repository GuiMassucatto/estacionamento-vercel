const API_BASE = "https://estacionamento-vercel.vercel.app"; 
let editandoPlaca = null;

document.addEventListener('DOMContentLoaded', function() {
  buscarVeiculos();
  configurarEventos();
});

document.getElementById("btnCadastrarEstadia").addEventListener("click", () => {
  window.location.href = "../estadia/estadias.html"; 
});

function configurarEventos() {
  document.getElementById("formCadastro").addEventListener("submit", async (e) => {
    e.preventDefault();

    const veiculo = {
      placa: document.getElementById("placa").value,
      tipo: document.getElementById("tipo").value,
      proprietario: document.getElementById("proprietario").value,
      modelo: document.getElementById("modelo").value,
      marca: document.getElementById("marca").value,
      cor: document.getElementById("cor").value || null,
      ano: document.getElementById("ano").value ? parseInt(document.getElementById("ano").value) : null,
      telefone: document.getElementById("telefone").value
    };

    try {
      let res;
      if (editandoPlaca) {
        res = await fetch(`${API_BASE}/veiculos/${editandoPlaca}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(veiculo)
        });
      } else {
        res = await fetch(`${API_BASE}/veiculos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(veiculo)
        });
      }

      if (!res.ok) {
        const erro = await res.json();
        alert(erro.erro || "Erro ao salvar veículo");
        return;
      }

      alert(editandoPlaca ? "Veículo atualizado!" : "Veículo cadastrado!");
      cancelarEdicao();
      buscarVeiculos();
      document.getElementById("formCadastro").reset();
    } catch {
      alert("Erro na operação.");
    }
  });

  document.getElementById("cancelarEdicao").addEventListener("click", cancelarEdicao);
}

function editarVeiculo(placa) {
  fetch(`${API_BASE}/veiculos/${placa}`)
    .then((res) => res.json())
    .then((v) => {
      document.getElementById("placa").value = v.placa;
      document.getElementById("tipo").value = v.tipo;
      document.getElementById("proprietario").value = v.proprietario;
      document.getElementById("modelo").value = v.modelo;
      document.getElementById("marca").value = v.marca;
      document.getElementById("cor").value = v.cor || "";
      document.getElementById("ano").value = v.ano || "";
      document.getElementById("telefone").value = v.telefone;

      editandoPlaca = v.placa;
      document.getElementById("placa").disabled = true;
      document.getElementById("formTitulo").textContent = "Editar Veículo";
      document.getElementById("cancelarEdicao").style.display = "inline-block";
    });
}

function cancelarEdicao() {
  editandoPlaca = null;
  document.getElementById("placa").disabled = false;
  document.getElementById("formTitulo").textContent = "Cadastrar Veículo";
  document.getElementById("cancelarEdicao").style.display = "none";
  document.getElementById("formCadastro").reset();
}

async function buscarVeiculos() {
  const placa = document.getElementById("placaBusca").value;
  const url = placa ? `${API_BASE}/veiculos/${placa}` : `${API_BASE}/veiculos`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const veiculos = Array.isArray(data) ? data : (data ? [data] : []);

    const lista = document.getElementById("listaVeiculos");
    lista.innerHTML = "";

    if (veiculos.length === 0) {
      lista.innerHTML = '<li class="veiculo-item">Nenhum veículo encontrado.</li>';
      return;
    }

    veiculos.forEach((v) => {
      const li = document.createElement("li");
      li.className = "veiculo-item";
      li.innerHTML = `
        <div class="veiculo-info">
          <div class="veiculo-placa">${v.placa}</div>
          <div class="veiculo-detalhes">
            <span>${v.modelo} (${v.marca})</span>
            <span>Proprietário: ${v.proprietario}</span>
            <span>Telefone: ${v.telefone}</span>
            <span>Tipo: ${v.tipo}</span>
            ${v.cor ? `<span>Cor: ${v.cor}</span>` : ''}
            ${v.ano ? `<span>Ano: ${v.ano}</span>` : ''}
          </div>
        </div>
        <div class="veiculo-acoes">
          <button class="btn-editar" onclick="editarVeiculo('${v.placa}')">Editar</button>
          <button class="btn-excluir" onclick="deletarVeiculo('${v.placa}')">Excluir</button>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch {
    alert("Erro ao buscar veículos.");
  }
}

async function deletarVeiculo(placa) {
  if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

  try {
    const res = await fetch(`${API_BASE}/veiculos/${placa}`, { method: "DELETE" });
    if (res.status === 404) {
      alert("Veículo não encontrado.");
      return;
    }
    buscarVeiculos();
  } catch {
    alert("Erro ao excluir veículo.");
  }
}