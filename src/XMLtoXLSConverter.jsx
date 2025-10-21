// BateCargaConferencia.jsx (FINAL: Leitura Robusta com Fallback para XLS Corrompido/CSV)
import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Download, X, ClipboardCheck, ChevronDown, ChevronUp, AlertCircle, Package, Truck, Calculator } from 'lucide-react';

// IMPORTANTE: Necessário para ler XLS/XLSX no navegador
// Certifique-se de que 'xlsx' está instalado (npm install xlsx)
import * as XLSX from 'xlsx'; 

/* ------------------ UTILS: XML DOM & Colors ------------------ */

const findFirstText = (node, localName) => {
    if (!node) return '';
    try {
        const nsMatches = node.getElementsByTagNameNS
            ? node.getElementsByTagNameNS('*', localName)
            : [];
        if (nsMatches && nsMatches.length > 0) return nsMatches[0].textContent || '';
    } catch (e) {}
    const all = node.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
        if (all[i].localName === localName) return all[i].textContent || '';
    }
    return '';
};

const findAll = (node, localName) => {
    if (!node) return [];
    try {
        const nsMatches = node.getElementsByTagNameNS
            ? Array.from(node.getElementsByTagNameNS('*', localName))
            : [];
        if (nsMatches.length > 0) return nsMatches;
    } catch (e) {}
    const all = node.getElementsByTagName('*');
    const out = [];
    for (let i = 0; i < all.length; i++) {
        if (all[i].localName === localName) out.push(all[i]);
    }
    return out;
};

const companyColors = {
    SAUDALI: 'from-blue-100 to-indigo-100 border-indigo-600 text-indigo-900',
    AURORA: 'from-green-100 to-emerald-100 border-emerald-600 text-emerald-900',
    BRF: 'from-orange-100 to-amber-100 border-amber-600 text-amber-900',
    default: 'from-slate-100 to-gray-100 border-blue-800 text-gray-800',
};

const getCompanyColorClass = (name) => {
    if (!name) return companyColors.default;
    const k = name.toUpperCase();
    if (k.includes('SAUDALI')) return companyColors.SAUDALI;
    if (k.includes('AURORA')) return companyColors.AURORA;
    if (k.includes('BRF')) return companyColors.BRF;
    return companyColors.default;
};

const getCompanyBorderColor = (name) => {
    const classes = getCompanyColorClass(name).split(' ');
    return classes.find(c => c.startsWith('border-'));
}

/**
 * Normaliza o número da Nota Fiscal (remove caracteres não numéricos) para matching
 */
const normalizeNnf = (nnf) => (nnf || '').toString().replace(/\D/g, '');


/* ------------------ COMPONENTE: CALCULADORA RÁPIDA ------------------ */

const QuickCalculator = () => {
    const [display, setDisplay] = useState('0');
    const [currentValue, setCurrentValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const clear = () => {
        setDisplay('0');
        setCurrentValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const inputDigit = (digit) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDot = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const performOperation = (nextOperator) => {
        const inputValue = parseFloat(display);

        if (currentValue === null) {
            setCurrentValue(inputValue);
        } else if (!waitingForOperand) {
            const prevValue = currentValue;
            let newValue = prevValue;

            try {
                switch (operator) {
                    case '+': newValue = prevValue + inputValue; break;
                    case '-': newValue = prevValue - inputValue; break;
                    case '*': newValue = prevValue * inputValue; break;
                    case '/': 
                        if (inputValue === 0) {
                            setDisplay('Erro');
                            clear();
                            return;
                        }
                        newValue = prevValue / inputValue; 
                        break;
                    default: break;
                }
                setCurrentValue(newValue);
                setDisplay(String(newValue));
            } catch (e) {
                setDisplay('Erro');
                clear();
                return;
            }
        }
        
        setWaitingForOperand(true);
        setOperator(nextOperator);
    };

    const equals = () => {
        performOperation('=');
        setOperator(null);
        setWaitingForOperand(false);
    }

    const buttonClasses = "p-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg font-bold transition duration-100";
    const operatorClasses = "p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-lg font-bold text-white transition duration-100";

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-lg w-full">
            <h3 className="text-md font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calculator className='w-4 h-4'/> Calculadora Rápida
            </h3>
            <div className="bg-gray-100 p-2 mb-2 text-right text-2xl font-mono rounded-lg shadow-inner border border-gray-300 overflow-x-auto">
                {display}
            </div>
            <div className="grid grid-cols-4 gap-2">
                {/* Linha 1 */}
                <button className={`${buttonClasses} col-span-2 bg-red-400 hover:bg-red-500 text-white`} onClick={clear}>C</button>
                <button className={operatorClasses} onClick={() => performOperation('/')}>/</button>
                <button className={operatorClasses} onClick={() => performOperation('*')}>x</button>
                
                {/* Linha 2 */}
                <button className={buttonClasses} onClick={() => inputDigit('7')}>7</button>
                <button className={buttonClasses} onClick={() => inputDigit('8')}>8</button>
                <button className={buttonClasses} onClick={() => inputDigit('9')}>9</button>
                <button className={operatorClasses} onClick={() => performOperation('-')}>-</button>

                {/* Linha 3 */}
                <button className={buttonClasses} onClick={() => inputDigit('4')}>4</button>
                <button className={buttonClasses} onClick={() => inputDigit('5')}>5</button>
                <button className={buttonClasses} onClick={() => inputDigit('6')}>6</button>
                <button className={operatorClasses} onClick={() => performOperation('+')}>+</button>
                
                {/* Linha 4 */}
                <button className={buttonClasses} onClick={() => inputDigit('1')}>1</button>
                <button className={buttonClasses} onClick={() => inputDigit('2')}>2</button>
                <button className={buttonClasses} onClick={() => inputDigit('3')}>3</button>
                <button className={`${operatorClasses} row-span-2`} onClick={equals}>=</button>

                {/* Linha 5 */}
                <button className={`${buttonClasses} col-span-2`} onClick={() => inputDigit('0')}>0</button>
                <button className={buttonClasses} onClick={inputDot}>.</button>
            </div>
        </div>
    );
};


/* ------------------ COMPONENTE PRINCIPAL ------------------ */

export default function BateCargaConferencia() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileNames, setFileNames] = useState([]);
    const [placaDataMap, setPlacaDataMap] = useState(new Map());
    const [logisticaFileName, setLogisticaFileName] = useState('');

    const totalItemsToExport = useMemo(() => {
        return groups.reduce((acc, g) => acc + g.totals.totalItems, 0);
    }, [groups]);

    const clearAll = useCallback(() => {
        setGroups([]);
        setFileNames([]);
        setError(null);
        setLoading(false);
        setPlacaDataMap(new Map());
        setLogisticaFileName('');
    }, []);

    
    // Função para aplicar os dados de placa às notas fiscais
    const mapPlacaToNotes = useCallback((notes, placaMap) => {
        return notes.map(note => {
            const cleanedNnf = normalizeNnf(note.nNF);
            const placaInfo = placaMap.get(cleanedNnf);
            return {
                ...note,
                Placa: placaInfo ? placaInfo.Placa : note.Placa || '',
            };
        });
    }, []);


    // -------------------------------------------------------------------
    // CORE: Função para processar a planilha de Logística (CSV/XLS/XLSX)
    // -------------------------------------------------------------------
    const processLogisticaData = (raw_data, fileName, placaMap) => {
        // --- 1. Normalização de Cabeçalhos ---
        const rawHeaders = raw_data[0] || [];
        const headers = rawHeaders.map(h => 
            (h || '').toString().toUpperCase().trim()
             .replace(/"/g, '')
             .replace(/[^A-Z0-9\s]/g, '') 
             .replace(/\s+/g, ' ') 
        );

        let nNFIndex = -1;
        let placaIndex = -1;
        
        // 2. Busca Flexível (corresponde a PLACA e NÚMERO NF)
        placaIndex = headers.findIndex(h => h.includes('PLACA') || h.includes('VEICULO'));
        nNFIndex = headers.findIndex(h => h.includes('NUMERO NF') || h.includes('N NOTA') || h.includes('NNF') || h.includes('NF'));
        
        // 3. Fallback (Colunas A e B com cabeçalhos simples)
        if (placaIndex === -1 && rawHeaders[0] && rawHeaders[0].toUpperCase().includes('PLACA')) placaIndex = 0;
        if (nNFIndex === -1 && rawHeaders[1] && rawHeaders[1].toUpperCase().includes('NF')) nNFIndex = 1;


        if (nNFIndex === -1 || placaIndex === -1) {
            throw new Error(`Não foi possível encontrar as colunas "PLACA" e "Número NF" (ou NNF/N_NOTA). Cabeçalhos lidos: [${rawHeaders.join(', ')}]`);
        }

        const newPlacaMap = new Map();
        // Começa a iteração a partir da SEGUNDA linha (índice 1), pulando o cabeçalho
        for (let i = 1; i < raw_data.length; i++) {
            const values = raw_data[i] || [];
            
            // Tratamento robusto: garante que os valores sejam strings limpas
            const nNF = (values[nNFIndex] || '').toString().trim();
            const placa = (values[placaIndex] || '').toString().trim();
            
            if (nNF && placa) {
                const cleanedNnf = normalizeNnf(nNF); 
                newPlacaMap.set(cleanedNnf, { Placa: placa.toUpperCase() });
            }
        }

        if (newPlacaMap.size === 0) {
            throw new Error('Nenhuma linha de dados válida (NF e Placa) foi encontrada na planilha.');
        }

        return newPlacaMap;
    }


    const handleLogisticaUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (groups.length === 0) {
            setError('Por favor, importe os arquivos XML primeiro para que o mapeamento possa ser aplicado.');
            e.target.value = null;
            return;
        }

        setLogisticaFileName(file.name);
        setError(null);
        setLoading(true);
        e.target.value = null;

        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();
        
        // Lógica de Leitura Primária (Binária para XLS/XLSX)
        const attemptBinaryRead = (arrayBuffer) => {
            try {
                const workbook = XLSX.read(arrayBuffer, { 
                    type: 'array',
                    cellText: false, 
                    cellDates: true 
                });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                if (!worksheet) {
                     throw new Error(`A aba "${sheetName}" não foi encontrada.`);
                }

                const raw_data = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    defval: "" 
                });
                
                if (raw_data.length <= 1) {
                    throw new Error('Planilha lida, mas sem dados na Linha 2.');
                }
                
                return processLogisticaData(raw_data, file.name, placaDataMap);

            } catch (err) {
                 // Em caso de falha binária, se for XLS ou CSV mal formatado, disparamos o fallback
                 if (extension === 'xls' || extension === 'csv') {
                     throw new Error('BINÁRIO_FALHA'); 
                 }
                 throw err; // Erro fatal para XLSX e XLS válidos
            }
        };

        // Lógica de Leitura Secundária (Texto para CSV/XLS corrompido)
        const attemptTextRead = (text) => {
            // Tentamos ler o texto como CSV usando a função nativa do SheetJS
            const workbook = XLSX.read(text, { 
                type: 'string',
                cellText: false, 
                cellDates: true 
            });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const raw_data = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: "" 
            });

            if (raw_data.length <= 1) {
                throw new Error('Leitura de Texto falhou ao encontrar dados.');
            }
            
            return processLogisticaData(raw_data, file.name, placaDataMap);
        };
        
        // Handler Principal
        reader.onload = async (event) => {
            try {
                let newPlacaMap;

                // Tenta leitura binária (padrão para Excel)
                if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
                    try {
                        newPlacaMap = attemptBinaryRead(event.target.result);
                    } catch (e) {
                        if (e.message !== 'BINÁRIO_FALHA') throw e; // Repassa erro fatal
                        
                        // Fallback para Leitura de Texto (para XLS corrompido/CSV)
                        // Reinicia o leitor para ler como texto (UTF-8)
                        const textReader = new FileReader();
                        textReader.onload = (e2) => {
                            try {
                                const map = attemptTextRead(e2.target.result);
                                setPlacaDataMap(map);
                                setGroups((prevGroups) => prevGroups.map(g => ({ ...g, notes: mapPlacaToNotes(g.notes, map), })));
                                setLoading(false);
                            } catch (e3) {
                                setError(`Erro ao processar ${file.name} (Texto): ${e3.message}`);
                                setLoading(false);
                            }
                        };
                        textReader.readAsText(file, 'UTF-8');
                        return; // Sai do handler principal enquanto o textReader carrega
                    }
                } else {
                    throw new Error('Extensão de arquivo não suportada.');
                }
                
                // Se a leitura binária for bem-sucedida (sem fallback)
                setPlacaDataMap(newPlacaMap);
                setGroups((prevGroups) => prevGroups.map(g => ({ ...g, notes: mapPlacaToNotes(g.notes, newPlacaMap), })));

            } catch (err) {
                console.error('Erro geral no upload da planilha', err);
                setError(`Erro ao processar ${file.name}: ${err.message}`);
                setPlacaDataMap(new Map());
            } finally {
                // A flag 'loading' é ajustada no callback do textReader ou no final deste bloco
                if (!error) setLoading(false);
            }
        };

        // Inicia a leitura primária (ArrayBuffer)
        reader.readAsArrayBuffer(file);
    };
    

    // -----------------------------------------------------------
    // CORE: Parse XML (INCLUINDO infAdProd para Qtde_aux E PESO POR ITEM)
    // -----------------------------------------------------------
    const parseNFDoc = (xmlDoc) => {
        const infNFe = findAll(xmlDoc, 'infNFe')[0] || xmlDoc;
        const ideNode = findAll(infNFe, 'ide')[0] || {};
        const nNF = findFirstText(ideNode, 'nNF') || findFirstText(xmlDoc, 'nNF');
        const dhEmiRaw = findFirstText(ideNode, 'dhEmi') || findFirstText(infNFe, 'dhEmi') || '';
        const dhEmi = dhEmiRaw ? dhEmiRaw.substring(0, 10).replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : '';

        const emitNode = findAll(infNFe, 'emit')[0];
        const emitName = findFirstText(emitNode, 'xNome') || '';
        const emitFant = findFirstText(emitNode, 'xFant') || emitName || '';

        const destNode = findAll(infNFe, 'dest')[0];
        const destName = findFirstText(destNode, 'xNome') || '';
        const enderDest = findAll(destNode, 'enderDest')[0];
        const destCity = findFirstText(enderDest, 'xMun') || '';
        const destUF = findFirstText(enderDest, 'UF') || '';

        const transporta = findAll(infNFe, 'transporta')[0];
        const transportName = findFirstText(transporta, 'xNome') || '';
        
        // Peso da nota (Total da NF) - MANTIDO para a nota e exibição no UI
        const volNode = findAll(infNFe, 'vol')[0] || findAll(findAll(infNFe, 'transp')[0], 'vol')[0] || null;
        const qVol = volNode ? (findFirstText(volNode, 'qVol') || '') : '';
        const pesoBNota = volNode ? (findFirstText(volNode, 'pesoB') || '') : ''; 
        const pesoLNota = volNode ? (findFirstText(volNode, 'pesoL') || '') : ''; 

        const icmstot = findAll(infNFe, 'ICMSTot')[0] || findAll(infNFe, 'total')[0];
        const vNF = icmstot ? (findFirstText(icmstot, 'vNF') || '') : findFirstText(infNFe, 'vNF') || '';

        const detNodes = findAll(infNFe, 'det');
        const items = detNodes.map((det) => {
            const prod = findAll(det, 'prod')[0] || det;
            const cProd = findFirstText(prod, 'cProd') || '';
            const xProd = findFirstText(prod, 'xProd') || '';
            const qCom = findFirstText(prod, 'qCom') || findFirstText(prod, 'qtd') || '';
            const uCom = findFirstText(prod, 'uCom') || '';
            const vUnCom = findFirstText(prod, 'vUnCom') || '';
            const vProd = findFirstText(prod, 'vProd') || '';
            
            // EXTRAÇÃO DE PESO POR ITEM: Se existirem nos tags <prod>
            const pesoBItem = findFirstText(prod, 'pesoB') || ''; 
            const pesoLItem = findFirstText(prod, 'pesoL') || ''; 
            
            // CAMPO Qtde_aux (extraído de infAdProd)
            const infAdProd = findFirstText(det, 'infAdProd') || '';

            return {
                cProd, xProd, qCom, uCom, vUnCom, vProd, infAdProd,
                pesoBItem: parseFloat(pesoBItem) || 0, // Peso Bruto do Item
                pesoLItem: parseFloat(pesoLItem) || 0, // Peso Líquido do Item
                Quantidade_Conferida: '',
                Status: '',
            };
        });

        const prot = findAll(xmlDoc, 'protNFe')[0] || findAll(xmlDoc, 'protNFe')[0];
        const chNFe = prot ? (findFirstText(prot, 'chNFe') || '') : '';

        return {
            chNFe, nNF, dhEmi, emitName, emitFant, destName, destCity, destUF, transportName,
            qVol: parseFloat(qVol) || 0,
            pesoB: parseFloat(pesoBNota) || 0, // Peso total da nota (Original)
            pesoL: parseFloat(pesoLNota) || 0, 
            vNF: parseFloat(vNF) || 0,
            items,
            rawXml: xmlDoc,
            Observacao: '', 
            Placa: '',
        };
    };

    const handleXMLUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setError(null);
        setLoading(true);
        setFileNames(files.map((f) => f.name));

        e.target.value = null;

        const notes = [];
        let processed = 0;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const xmlString = ev.target.result;
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

                    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                        throw new Error(`Parser error no arquivo ${file.name}`);
                    }
                    let note = parseNFDoc(xmlDoc);
                    
                    const cleanedNnf = normalizeNnf(note.nNF);
                    const placaInfo = placaDataMap.get(cleanedNnf);
                    if (placaInfo) {
                        note.Placa = placaInfo.Placa;
                    }
                    
                    if (note && note.items && note.items.length > 0) notes.push(note);
                } catch (err) {
                    console.error('Erro parse XML', file.name, err);
                    setError((prev) => prev ? `${prev}\nErro em ${file.name}` : `Erro em ${file.name}`);
                } finally {
                    processed += 1;
                    if (processed === files.length) {
                        if (notes.length === 0) {
                            setError((prev) => prev ? prev : 'Nenhum item válido encontrado.');
                        }
                        const grouped = [];
                        notes.forEach((note) => {
                            const key = `${note.emitFant}||${note.destCity}`;
                            const idx = grouped.findIndex((g) => g.key === key);
                            if (idx === -1) {
                                grouped.push({
                                    key,
                                    emitFant: note.emitFant,
                                    emitName: note.emitName,
                                    city: note.destCity,
                                    uf: note.destUF,
                                    notes: [{ ...note, open: false }],
                                    totals: {
                                        totalPesoB: note.pesoB || 0,
                                        totalQVol: note.qVol || 0, 
                                        totalVNF: note.vNF || 0,
                                        totalNotes: 1,
                                        totalItems: note.items.length,
                                    },
                                    open: true,
                                });
                            } else {
                                const g = grouped[idx];
                                g.notes.push({ ...note, open: false });
                                g.totals.totalPesoB += note.pesoB || 0;
                                g.totals.totalQVol += note.qVol || 0; 
                                g.totals.totalVNF += note.vNF || 0;
                                g.totals.totalNotes += 1;
                                g.totals.totalItems += note.items.length;
                            }
                        });
                        setGroups(grouped);
                        setLoading(false);
                    }
                }
            };
            reader.readAsText(file, 'UTF-8');
        });
    };

    // -----------------------------------------------------------
    // CORE: Funções de Interação e Exportação
    // -----------------------------------------------------------

    const toggleGroup = (key) => {
        setGroups((prev) =>
            prev.map((g) => (g.key === key ? { ...g, open: !g.open } : g))
        );
    };

    const toggleNoteOpen = (groupKey, noteIndex) => {
        setGroups((prev) =>
            prev.map((g) =>
                g.key === groupKey
                    ? {
                        ...g,
                        notes: g.notes.map((n, idx) =>
                            idx === noteIndex ? { ...n, open: !n.open } : n
                        ),
                    }
                    : g
            )
        );
    };

    const handleObservacaoChange = (groupKey, noteIndex, value) => {
        setGroups((prev) =>
            prev.map((g) => {
                if (g.key !== groupKey) return g;
                const notes = g.notes.map((n, ni) => {
                    if (ni !== noteIndex) return n;
                    return { ...n, Observacao: value };
                });
                return { ...g, notes };
            })
        );
    };


    const handleQuantidadeChange = (groupKey, noteIndex, itemIndex, value) => {
        setGroups((prev) =>
            prev.map((g) => {
                if (g.key !== groupKey) return g;
                const notes = g.notes.map((n, ni) => {
                    if (ni !== noteIndex) return n;
                    const items = n.items.map((it, ii) => {
                        if (ii !== itemIndex) return it;
                        const updated = { ...it, Quantidade_Conferida: value };
                        const expected = parseFloat((it.qCom || '').toString().replace(',', '.')) || 0;
                        const conf = parseFloat((value || '').toString().replace(',', '.')) || 0;
                        if (conf === expected && expected > 0) {
                            updated.Status = 'OK';
                        } else if (conf === 0 || value === '') {
                            updated.Status = '';
                        } else {
                            updated.Status = 'Divergente';
                        }
                        return updated;
                    });
                    return { ...n, items };
                });
                return { ...g, notes };
            })
        );
    };

    // **AJUSTE DE EXPORTAÇÃO: Inclui Peso por Item (PesoB_Item e PesoL_Item) e o Qtd/Peso (qCom)**
    const exportToCSV = () => {
        if (!groups || groups.length === 0) {
            setError('Nenhum dado para exportar.');
            return;
        }

        // Definindo os cabeçalhos. 'Qtd_Item_XML' é o valor do qCom.
        const headers = [
            'Grupo_Emitente', 'Cidade', 'nNF', 'dhEmi', 'Placa_Veiculo', 'Transportadora', 
            'PesoB_Nota_Total', 'QVol', 'vNF_Nota_Total', // Dados totais da nota
            'cProd', 'xProd', 
            'Qtd_Item_XML', // <--- Qtd/Peso (qCom)
            'PesoB_Item', // <--- Peso Bruto por Item (se existir no XML item)
            'PesoL_Item', // <--- Peso Líquido por Item (se existir no XML item)
            'Unidade_Com', 'Valor_Total_Item',
            'Qtd_Conferida', 'Status_Conferencia', 'Qtde_Aux',
            'Observacao', 
        ];

        let csv = '\ufeff' + headers.join(';') + '\n';
        groups.forEach((g) => {
            g.notes.forEach((n) => {
                n.items.forEach((it) => {
                    const formatValue = (val) => {
                        if (val === null || val === undefined) return '""';
                        let str = val.toString();
                        str = str.replace(/\n/g, ' ').replace(/"/g, '""');
                        
                        // Se for número, formatar com 4 casas decimais e vírgula como separador decimal
                        if (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)))) {
                            // Tenta converter para número, formata e substitui o ponto decimal por vírgula
                            try {
                                const num = parseFloat(str);
                                str = num.toFixed(4).replace('.', ','); 
                            } catch (e) {
                                // Em caso de erro, apenas mantém a string
                                str = val.toString().replace(/\n/g, ' ').replace(/"/g, '""');
                            }
                        }
                        return `"${str}"`;
                    };

                    const row = [
                        formatValue(g.emitFant), formatValue(g.city || ''), formatValue(n.nNF || ''),
                        formatValue(n.dhEmi || ''), formatValue(n.Placa || ''), 
                        formatValue(n.transportName || ''), 
                        formatValue(n.pesoB || ''), // Peso Bruto Total da Nota
                        formatValue(n.qVol || ''), 
                        formatValue(n.vNF || ''), 
                        formatValue(it.cProd || ''),
                        formatValue(it.xProd || ''), 
                        
                        formatValue(it.qCom || ''), // Qtd_Item_XML (qCom)
                        
                        formatValue(it.pesoBItem), // Peso Bruto do Item
                        formatValue(it.pesoLItem), // Peso Líquido do Item
                        
                        formatValue(it.uCom || ''),
                        formatValue(it.vProd || ''), 
                        formatValue(it.Quantidade_Conferida || ''),
                        formatValue(it.Status || ''),
                        formatValue(it.infAdProd || ''), 
                        formatValue(n.Observacao || ''),
                    ];
                    csv += row.join(';') + '\n';
                });
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bate_carga_export_${new Date().getTime()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ------------------ RENDER (UI) ------------------ */
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-blue-800 shadow-xl p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ClipboardCheck className="w-7 h-7 text-white" />
                        <h1 className="text-xl font-extrabold text-white tracking-wide">
                            SISTEMA DE CONFERÊNCIA DE CARGA <span className="text-blue-200">| FRIOLOG</span>
                        </h1>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-8">

                {/* Grid para Upload e Calculadora */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    
                    {/* Card de Upload e Ações (2/3 da largura em telas grandes) */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-2xl p-6 border border-blue-100 h-fit">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className='flex items-center gap-4'>
                                <div className="p-3 bg-blue-100 rounded-full border border-blue-300 flex-shrink-0">
                                    <Package className="w-6 h-6 text-blue-800" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Conferência de Carga</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Importe arquivos XML (NF-e) e a planilha de logística (XLS/XLSX/CSV).
                                    </p>
                                </div>
                            </div>
                            {/* Ações (Botões) */}
                            <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 md:justify-end">
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={groups.length === 0}
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar CSV ({totalItemsToExport} itens)
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={groups.length === 0 && fileNames.length === 0 && !error && !loading}
                                >
                                    <X className="w-4 h-4" />
                                    Limpar
                                </button>
                            </div>
                        </div>

                        <div className="mt-6">
                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span className='whitespace-pre-line text-sm'>{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col lg:flex-row items-center gap-4">
                            {/* INPUT 1: XML UPLOAD */}
                            <label className={`cursor-pointer w-full lg:w-1/2`}>
                                <div className={`border-2 border-dashed rounded-lg p-3 flex items-center gap-4 min-w-[300px] transition duration-200
                                        ${fileNames.length > 0 ? 'bg-green-50 border-green-400 text-green-700' : 'bg-white border-blue-500 hover:bg-blue-50'}`}>
                                    <Upload className="w-5 h-5 text-blue-700 flex-shrink-0" />
                                    <div>
                                        <div className="font-semibold text-sm">
                                            {fileNames.length > 0 ? `${fileNames.length} arquivo(s) XML carregado(s)` : '1. Carregar Notas Fiscais (XML)'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Aceita múltiplos arquivos .xml
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept=".xml"
                                    multiple
                                    onChange={handleXMLUpload}
                                    className="hidden"
                                />
                            </label>

                            {/* INPUT 2: LOGISTICA/PLACA UPLOAD (XLS/XLSX/CSV) */}
                            <label className={`cursor-pointer w-full lg:w-1/2`}>
                                <div className={`border-2 border-dashed rounded-lg p-3 flex items-center gap-4 min-w-[300px] transition duration-200
                                        ${placaDataMap.size > 0 ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-blue-500 hover:bg-blue-50'}
                                        ${groups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Truck className="w-5 h-5 text-indigo-700 flex-shrink-0" />
                                    <div>
                                        <div className="font-semibold text-sm">
                                            {logisticaFileName ? `2. Planilha de Logística: ${logisticaFileName} (${placaDataMap.size} placas mapeadas)` : '2. Carregar Planilha de Logística (Opcional)'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Aceita **XLS/XLSX/CSV** com **PLACA** e **Número NF**
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                                    onChange={handleLogisticaUpload}
                                    className="hidden"
                                    disabled={groups.length === 0}
                                />
                            </label>

                            {loading && <div className="text-sm text-blue-700 font-semibold flex items-center gap-2 animate-pulse ml-4 flex-shrink-0">
                                <div className="w-3 h-3 bg-blue-700 rounded-full"></div> Processando arquivos...
                            </div>}
                        </div>
                    </div>

                    {/* Componente Calculadora (1/3 da largura em telas grandes) */}
                    <div className="lg:col-span-1">
                        <QuickCalculator />
                    </div>
                </div>

                {/* Groups List (Renderização dos dados) */}
                <div className="space-y-6 pt-4">
                    {groups.length === 0 && !loading && (
                        <div className="text-center text-gray-500 p-12 bg-white rounded-xl border border-gray-200 shadow-md">
                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-lg font-medium">Aguardando a importação dos XMLs...</p>
                        </div>
                    )}
                    {groups.map((g) => {
                        const colorClasses = getCompanyColorClass(g.emitFant);
                        const borderColor = getCompanyBorderColor(g.emitFant);
                        const textColor = colorClasses.split(' ').find(c => c.startsWith('text-'));

                        return (
                            <div key={g.key} className={`rounded-xl border ${borderColor} overflow-hidden shadow-lg transition duration-200 hover:shadow-xl`}>
                                {/* Header do Grupo */}
                                <div
                                    className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 ${colorClasses.includes('from-') ? 'bg-gradient-to-r' : ''} ${colorClasses} bg-opacity-70 cursor-pointer`}
                                    onClick={() => toggleGroup(g.key)}
                                >
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            className={`p-1.5 rounded-full bg-white/40 ${textColor.replace('text-', 'text-')} hover:bg-white/70 transition flex-shrink-0`}
                                            aria-label={g.open ? 'Fechar Grupo' : 'Abrir Grupo'}
                                            onClick={(e) => { e.stopPropagation(); toggleGroup(g.key); }}
                                        >
                                            {g.open ? <ChevronUp className='w-5 h-5' /> : <ChevronDown className='w-5 h-5' />}
                                        </button>
                                        <div>
                                            <div className={`text-xl font-extrabold ${textColor}`}>
                                                {g.emitFant || g.emitName}
                                                <span className="text-sm font-medium text-gray-600 ml-2">
                                                    / {g.city}{g.uf ? ` - ${g.uf}` : ''}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-700 font-medium mt-1">
                                                <span className="font-bold">{g.totals.totalNotes}</span> Notas •
                                                <span className="font-bold"> {g.totals.totalItems}</span> Itens
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 text-right mt-3 md:mt-0 border-l pl-4 border-gray-300">
                                        <div className="text-sm text-gray-600">Peso Bruto Total</div>
                                        <div className={`text-2xl font-extrabold ${textColor}`}>{Number(g.totals.totalPesoB || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg</div>
                                        <div className="text-xs text-gray-600">
                                            {g.totals.totalQVol} volumes • R$ {Number(g.totals.totalVNF || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                {/* Conteúdo (notas) */}
                                {g.open && (
                                    <div className="bg-white p-4 sm:p-6 border-t border-gray-200">
                                        <div className="space-y-4">
                                            {g.notes.map((n, ni) => (
                                                <div key={n.nNF + ni} className="border border-gray-200 rounded-lg shadow-md overflow-hidden bg-white">

                                                    {/* Header da Nota */}
                                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                                                        <div className="flex-grow min-w-0">
                                                            <div className="text-lg font-bold text-gray-800">
                                                                NF: <span className="text-blue-700">{n.nNF}</span>
                                                                <span className="text-sm font-normal text-gray-500 ml-2">({n.dhEmi})</span>
                                                            </div>
                                                            <div className="text-xs text-gray-600 mt-1">
                                                                <span className="font-medium">Destinatário:</span> {n.destName} |
                                                                <span className="font-medium"> Transp:</span> {n.transportName || 'Não Informado'}
                                                            </div>

                                                            {/* Informação da Placa */}
                                                            <div className="text-sm text-gray-700 mt-2">
                                                                <span className="font-medium">Placa do Veículo:</span>
                                                                <span className={`font-bold ml-1 ${n.Placa ? 'text-indigo-600' : 'text-red-500'}`}>
                                                                    {n.Placa || 'NÃO INFORMADA'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-3 lg:mt-0 lg:ml-4">
                                                            {/* Campo Observação */}
                                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                                <label htmlFor={`observacao-${g.key}-${ni}`} className="text-sm font-medium text-gray-700 flex-shrink-0">
                                                                    Observação:
                                                                </label>
                                                                <input
                                                                    id={`observacao-${g.key}-${ni}`}
                                                                    type="text"
                                                                    value={n.Observacao || ''}
                                                                    onChange={(ev) => handleObservacaoChange(g.key, ni, ev.target.value)}
                                                                    placeholder="Detalhes da conferência..."
                                                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                            
                                                            <div className="text-right flex-shrink-0 hidden sm:block">
                                                                <div className="text-sm text-gray-500">Peso (NF)</div>
                                                                <div className="font-bold text-gray-800">
                                                                    {n.pesoB ? Number(n.pesoB).toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : '0'} kg
                                                                </div>
                                                                {/* EXIBIÇÃO DO qVol NA NOTA */}
                                                                <div className="text-xs text-gray-500">Volumes: {n.qVol}</div> 
                                                            </div>

                                                            <button
                                                                onClick={() => toggleNoteOpen(g.key, ni)}
                                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition duration-150
                                                                    ${n.open ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-md' : 'bg-white text-blue-700 border border-blue-500 hover:bg-blue-50'} flex-shrink-0`}
                                                            >
                                                                {n.open ? 'Ocultar Itens' : 'Conferir Itens'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Produtos (expandido) */}
                                                    {n.open && (
                                                        <div className="p-4">
                                                            <div className="overflow-x-auto border rounded-lg">
                                                                <table className="min-w-full text-sm divide-y divide-gray-200">
                                                                    <thead className="bg-slate-100 sticky top-0">
                                                                        <tr className="text-left text-gray-700 uppercase tracking-wider">
                                                                            <th className="px-3 py-2 font-bold whitespace-nowrap">Cód.</th>
                                                                            <th className="px-3 py-2 font-bold min-w-[200px]">Produto</th>
                                                                            <th className="px-3 py-2 font-bold text-center whitespace-nowrap">Qtd XML</th>
                                                                            <th className="px-3 py-2 font-bold text-center">Un</th>
                                                                            <th className="px-3 py-2 font-bold text-right whitespace-nowrap">Valor Total (R$)</th>
                                                                            <th className="px-3 py-2 font-bold text-center min-w-[120px]">Qtd Conferida</th>
                                                                            <th className="px-3 py-2 font-bold text-center whitespace-nowrap">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {n.items.map((it, ii) => {
                                                                            let statusClass = 'text-slate-500';
                                                                            if (it.Status === 'OK') statusClass = 'text-emerald-700 bg-emerald-100 font-semibold';
                                                                            if (it.Status === 'Divergente') statusClass = 'text-red-700 bg-red-100 font-semibold';

                                                                            return (
                                                                                <tr key={it.cProd + ii} className="hover:bg-gray-50">
                                                                                    <td className="px-3 py-3 align-top whitespace-nowrap text-gray-600">{it.cProd || '-'}</td>
                                                                                    <td className="px-3 py-3 align-top text-gray-800">
                                                                                        {it.xProd || '-'}
                                                                                        {/* EXIBIÇÃO DO Qtde_aux (infAdProd) NA TABELA */}
                                                                                        {it.infAdProd && (
                                                                                            <div className="text-xs text-blue-500 mt-1 italic font-medium">
                                                                                                Qtde_aux: {it.infAdProd}
                                                                                            </div>
                                                                                        )}
                                                                                        {/* EXIBIÇÃO DO PESO DO ITEM NA TABELA (OPCIONAL, para visualização) */}
                                                                                        {(it.pesoBItem > 0 || it.pesoLItem > 0) && (
                                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                                Peso Item: B: {it.pesoBItem.toLocaleString('pt-BR')}kg | L: {it.pesoLItem.toLocaleString('pt-BR')}kg
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-3 py-3 align-top text-center font-medium text-gray-700 whitespace-nowrap">{it.qCom || '-'}</td>
                                                                                    <td className="px-3 py-3 align-top text-center text-gray-600">{it.uCom || '-'}</td>
                                                                                    <td className="px-3 py-3 align-top text-right font-medium text-gray-700 whitespace-nowrap">
                                                                                        {it.vProd ? Number(it.vProd).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 align-top w-40">
                                                                                        <input
                                                                                            type="number"
                                                                                            value={it.Quantidade_Conferida || ''}
                                                                                            onChange={(ev) => handleQuantidadeChange(g.key, ni, ii, ev.target.value)}
                                                                                            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-center text-sm shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                                                            placeholder="0"
                                                                                            min="0"
                                                                                        />
                                                                                    </td>
                                                                                    <td className={`px-3 py-2 align-middle text-center whitespace-nowrap ${statusClass} rounded-r-lg`}>
                                                                                        {it.Status === 'OK' ? 'CONFERIDO' : it.Status === 'DIVERGENTE' ? 'DIVERGENTE' : 'PENDENTE'}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}