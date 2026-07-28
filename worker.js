// Listener nativo do Web Worker
self.onmessage = function(e) {
    const { runes, setFilter, minSpd, minCrit } = e.data;

    // 1. Organização das runas em arrays baseados nos slots (1 a 6)
    let slots = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    runes.forEach(rune => {
        if (slots[rune.slot_no]) {
            slots[rune.slot_no].push(rune);
        }
    });

    let validBuilds = [];

    // Mapeamento dos IDs de conjuntos comuns da Com2uS (Adaptação base de Dados)
    const setMapping = { 1: 'Energy', 2: 'Guard', 3: 'Swift', 4: 'Blade', 5: 'Rage', 6: 'Focus', 13: 'Violent', 14: 'Will' };

    // 2. Loops combinatórios de alta densidade computacional
    for (let r1 of slots[1]) {
        for (let r2 of slots[2]) {
            for (let r3 of slots[3]) {
                for (let r4 of slots[4]) {
                    for (let r5 of slots[5]) {
                        for (let r6 of slots[6]) {

                            let combo = [r1, r2, r3, r4, r5, r6];
                            let spd = 0, hp = 0, atk = 0, def = 0, critRate = 0;
                            let setCounts = {};

                            // Processamento das estatísticas da combinação de runas
                            combo.forEach(r => {
                                // Consolida estatísticas principais e secundárias do JSON Com2uS
                                let stats = [r.main_stat, r.prefix_stat, ...(r.sec_stats || [])];
                                stats.forEach(s => {
                                    if (!s) return;
                                    const type = s[0]; // ID do atributo do jogo
                                    const value = s[1]; // Valor numérico
                                    
                                    if (type === 8) spd += value;       // 8 = SPD Flat
                                    if (type === 2) hp += value;        // 2 = HP%
                                    if (type === 3) hp += value;        // 3 = HP Flat
                                    if (type === 4) atk += value;       // 4 = ATK%
                                    if (type === 6) def += value;       // 6 = DEF%
                                    if (type === 11) critRate += value; // 11 = Crit Rate%
                                });

                                // Agrupamento dos identificadores de Sets
                                setCounts[r.set_id] = (setCounts[r.set_id] || 0) + 1;
                            });

                            // 3. Verificação de bónus de conjunto ativo
                            let activeSetName = "Broken Set";
                            for (let setId in setCounts) {
                                let count = setCounts[setId];
                                let name = setMapping[setId] || "Outro";
                                if (count >= 4 && (name === 'Swift' || name === 'Violent' || name === 'Rage' || name === 'Fatal')) {
                                    activeSetName = name;
                                    if (name === 'Swift') spd += 25; // Exemplo de aplicação de bónus estatístico
                                }
                            }

                            // 4. Filtragem e Validação Rígida
                            if (setFilter !== "ANY" && activeSetName !== setFilter) continue;
                            if (spd < minSpd) continue;
                            if (critRate < minCrit) continue;

                            validBuilds.push({
                                set: activeSetName,
                                spd: spd,
                                hp: hp,
                                def: def,
                                atk: atk,
                                critRate: critRate
                            });
                        }
                    }
                }
            }
        }
    }

    // Ordenação rápida decrescente com foco na maior velocidade (Meta do Summoners War)
    validBuilds.sort((a, b) => b.spd - a.spd);

    // Retorna apenas as 100 melhores combinações para poupar a memória do navegador
    self.postMessage(validBuilds.slice(0, 100));
};
