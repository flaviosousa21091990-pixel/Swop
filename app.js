let gameData = null;
let optimizationWorker = null;

// Elementos DOM
const jsonInput = document.getElementById('jsonInput');
const importStatus = document.getElementById('importStatus');
const monsterSelect = document.getElementById('monsterSelect');
const optimizeBtn = document.getElementById('optimizeBtn');
const resultsBody = document.getElementById('resultsBody');
const calcStatus = document.getElementById('calcStatus');

// Listener de Importação do JSON gerado pelo SWEX
jsonInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            gameData = JSON.parse(event.target.result);
            importStatus.innerText = `Sucesso! Importados: ${gameData.monsters.length} monstros e ${gameData.runes.length} runas.`;
            importStatus.style.color = "#04d361";
            
            // Popula o Dropdown de Monstros
            monsterSelect.innerHTML = '';
            gameData.monsters.forEach(mon => {
                const opt = document.createElement('option');
                opt.value = mon.unit_id;
                opt.innerText = `Monstro ID: ${mon.unit_id} (${mon.class} estrelas)`;
                monsterSelect.appendChild(opt);
            });
            
            monsterSelect.disabled = false;
            optimizeBtn.disabled = false;
        } catch (err) {
            importStatus.innerText = "Erro: Ficheiro JSON inválido ou corrompido.";
            importStatus.style.color = "#f75a68";
        }
    };
    reader.readAsText(file);
});

// Inicialização da Otimização por Web Worker
optimizeBtn.addEventListener('click', function() {
    if (!gameData) return;

    calcStatus.innerText = "A calcular triliões de combinações na CPU em segundo plano...";
    calcStatus.style.color = "#8257e5";
    resultsBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">A processar...</td></tr>`;

    // Termina worker anterior se existir
    if (optimizationWorker) optimizationWorker.terminate();

    // Cria o Web Worker utilizando o ficheiro externo worker.js
    optimizationWorker = new Worker('worker.js');

    // Envia os dados e os filtros para o Worker
    optimizationWorker.postMessage({
        runes: gameData.runes,
        setFilter: document.getElementById('setFilter').value,
        minSpd: parseInt(document.getElementById('minSpd').value) || 0,
        minCrit: parseInt(document.getElementById('minCrit').value) || 15
    });

    // Recebe o array final compilado do Worker
    optimizationWorker.onmessage = function(e) {
        const builds = e.data;
        calcStatus.innerText = `Cálculo concluído! Encontradas ${builds.length} builds compatíveis. Apresentando as 100 melhores por velocidade.`;
        calcStatus.style.color = "#04d361";

        if (builds.length === 0) {
            resultsBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color:#f75a68;">Nenhuma build atende aos filtros de SPD/CR especificados.</td></tr>`;
            return;
        }

        // Renderização otimizada em HTML
        let htmlBuffer = '';
        builds.forEach(b => {
            htmlBuffer += `<tr>
                <td><strong>${b.set}</strong></td>
                <td>+${b.hp}</td>
                <td>+${b.atk}</td>
                <td>+${b.def}</td>
                <td><span style="color:#04d361; font-weight:bold;">+${b.spd}</span></td>
                <td>${b.critRate}%</td>
            </tr>`;
        });
        resultsBody.innerHTML = htmlBuffer;
    };
});
