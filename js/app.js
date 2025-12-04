
(function(){
  const API = "https://fitcalc-backend.onrender.com";

  // ---------- common ----------
  function getToken(){ 
    return localStorage.getItem("token"); 
  }

  function requireAuth(){ 
    if(!getToken()){
      if(!location.pathname.includes("index.html")){
        window.location.href = "index.html";
      }
    }
  }

  // ---------- login ----------
  document.getElementById("loginForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try{
      const res = await fetch(`${API}/auth/login`, { 
        method:"POST", 
        headers:{"Content-Type":"application/json"}, 
        body:JSON.stringify({email,password}) 
      });

      const data = await res.json();

      if(!res.ok){ 
        document.getElementById("msg").textContent = data.message || "Usuário ou senha inválidos"; 
        return; 
      }

      // corrigido: usar access_token
      localStorage.setItem("token", data.access_token);
      window.location.href = "dashboard.html";

    }catch(err){ 
      console.error(err); 
      document.getElementById("msg").textContent = "Erro de conexão"; 
    }
  });

  // ---------- register ----------
  document.getElementById("registerForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try{
      const res = await fetch(`${API}/auth/register`, { 
        method:"POST", 
        headers:{"Content-Type":"application/json"}, 
        body:JSON.stringify({name,email,password}) 
      });

      const data = await res.json();

      if(!res.ok){
        document.getElementById("msg").textContent = data.message || "Erro no registro";
        return;
      }

      document.getElementById("msg").textContent = data.message || "Registro realizado com sucesso";

    }catch(err){ 
      console.error(err); 
      document.getElementById("msg").textContent = "Erro de conexão"; 
    }
  });

  // ---------- logout ----------
  document.getElementById("logoutBtn")?.addEventListener("click", ()=>{
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });

  // ---------- IMC ----------
  document.getElementById("btnCalcularIMC")?.addEventListener("click", async ()=>{
    requireAuth();

    const token = getToken();
    const peso = parseFloat(document.getElementById("peso").value);
    const altura = parseFloat(document.getElementById("altura").value) / 100;

    if(!peso || !altura){
      alert("Preencha peso e altura");
      return;
    }

    const imc = peso / (altura * altura);

    document.getElementById("resultadoIMC").innerHTML = 
      `IMC: <strong>${imc.toFixed(2)}</strong>`;

    await fetch(`${API}/daily-log`, { 
      method:"POST", 
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${token}`
      }, 
      body:JSON.stringify({ weight: peso, height: altura*100, imc }) 
    });
  });

  // ---------- TMB ----------
  document.getElementById("btnCalcularTMB")?.addEventListener("click", async ()=>{
    requireAuth();

    const token = getToken();
    const peso = parseFloat(document.getElementById("pesoTMB").value);
    const altura = parseFloat(document.getElementById("alturaTMB").value);
    const idade = parseInt(document.getElementById("idadeTMB").value);
    const sexo = document.getElementById("sexoTMB").value;

    if(!peso || !altura || !idade || !sexo){
      alert("Preencha todos os campos");
      return;
    }

    let tmb = sexo === "M" 
      ? 88.36 + (13.4*peso) + (4.8*altura) - (5.7*idade)
      : 447.6 + (9.2*peso) + (3.1*altura) - (4.3*idade);

    document.getElementById("resultadoTMB").innerHTML = 
      `TMB: <strong>${tmb.toFixed(0)} kcal/dia</strong>`;

    await fetch(`${API}/daily-log`, { 
      method:"POST", 
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${token}`
      }, 
      body:JSON.stringify({ tmb }) 
    });
  });

  // ---------- daily-consumption ----------
  document.getElementById("btnRegistrarConsumo")?.addEventListener("click", async ()=>{
    requireAuth();

    const token = getToken();
    const calorias = Number(document.getElementById("calorias").value);
    const treinoMin = Number(document.getElementById("treino").value);

    if(!calorias || !treinoMin){
      alert("Preencha os campos");
      return;
    }

    const res = await fetch(`${API}/daily-consumption`, { 
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${token}`
      },
      body:JSON.stringify({ calorias, treinoMin }) 
    });

    if(!res.ok){
      alert("Erro ao registrar");
      return;
    }

    alert("Registrado com sucesso");
    loadCharts();
  });

  // ---------- load charts ----------
  async function loadCharts(){
    requireAuth();

    const token = getToken();
    const res = await fetch(`${API}/daily-consumption`, { 
      headers:{
        "Authorization":`Bearer ${token}`
      } 
    });

    const consumos = await res.json();

    const labels = consumos.map(x=> new Date(x.createdAt).toLocaleDateString());
    const cal = consumos.map(x=> x.calorias);
    const tre = consumos.map(x=> x.treinoMin);

    if(document.getElementById("graficoCalorias")){
      if(window._chartCal) window._chartCal.destroy();
      window._chartCal = new Chart(document.getElementById("graficoCalorias"), { 
        type:"line", 
        data:{ labels, datasets:[{ label:"Calorias (kcal)", data:cal, backgroundColor: "black", borderColor: "#c35753",borderWidth: 4, borderRadius: 8, barPercentage: 0.6 }] } 
      });
    }

    if(document.getElementById("graficoTreino")){
      if(window._chartTre) window._chartTre.destroy();
      window._chartTre = new Chart(document.getElementById("graficoTreino"), { 
        type:"bar", 
        data:{ labels, datasets:[{ label:"Treino (min)", data:tre, backgroundColor: "#c35753", borderColor: "black",borderWidth: 2, borderRadius: 6, barPercentage: 0.6 }] } 
      });
    }
  }

  // ---------- run charts on load ----------
  window.addEventListener("load", ()=>{ 
    if(document.getElementById("graficoCalorias") || document.getElementById("graficoTreino")){
      setTimeout(()=>{ loadCharts().catch(()=>{}); }, 200);
    }
  });

})();
