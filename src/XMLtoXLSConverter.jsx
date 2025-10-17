// BateCargaConferencia.jsx (Layout com Identidade Friolog Brasil - Ajustado)
import React, { useState, useCallback } from 'react';
import { Upload, Download, X, ClipboardCheck, ChevronDown, ChevronUp, AlertCircle, Package } from 'lucide-react';

/* ------------------ Utilitários para XML com namespace (mantidos) ------------------ */
// ... (funções findFirstText e findAll mantidas)

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

/* ------------------ Colors por empresa (ajuste para identidade) ------------------ */
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

/* ------------------ Componente ------------------ */
export default function BateCargaConferencia() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileNames, setFileNames] = useState([]);

  // Limpa todos os dados
  const clearAll = useCallback(() => {
    setGroups([]);
    setFileNames([]);
    setError(null);
    setLoading(false);
  }, []);

  // ... (função parseNFDoc mantida)
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
    const volNode = findAll(infNFe, 'vol')[0] || findAll(findAll(infNFe, 'transp')[0], 'vol')[0] || null;
    const qVol = volNode ? (findFirstText(volNode, 'qVol') || '') : '';
    const pesoB = volNode ? (findFirstText(volNode, 'pesoB') || '') : '';
    const pesoL = volNode ? (findFirstText(volNode, 'pesoL') || '') : '';

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
      const infAdProd = findFirstText(det, 'infAdProd') || '';
      
      return {
        cProd,
        xProd,
        qCom,
        uCom,
        vUnCom,
        vProd,
        infAdProd,
        Quantidade_Conferida: '',
        Status: '',
      };
    });

    const prot = findAll(xmlDoc, 'protNFe')[0] || findAll(xmlDoc, 'protNFe')[0];
    const chNFe = prot ? (findFirstText(prot, 'chNFe') || '') : '';

    return {
      chNFe,
      nNF,
      dhEmi,
      emitName,
      emitFant,
      destName,
      destCity,
      destUF,
      transportName,
      qVol: parseFloat(qVol) || 0,
      pesoB: parseFloat(pesoB) || 0,
      pesoL: parseFloat(pesoL) || 0,
      vNF: parseFloat(vNF) || 0,
      items,
      rawXml: xmlDoc,
      Romaneio: '', 
    };
  };

  // ... (função handleXMLUpload mantida)
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
          const note = parseNFDoc(xmlDoc);
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

  // ... (funções toggleGroup, toggleNoteOpen, handleRomaneioChange, handleQuantidadeChange e exportToCSV mantidas)

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
  
  const handleRomaneioChange = (groupKey, noteIndex, value) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.key !== groupKey) return g;
        const notes = g.notes.map((n, ni) => {
          if (ni !== noteIndex) return n;
          return { ...n, Romaneio: value };
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

  const exportToCSV = () => {
    if (!groups || groups.length === 0) {
      setError('Nenhum dado para exportar.');
      return;
    }

    const headers = [
      'Grupo_Emitente', 'Cidade', 'nNF', 'dhEmi', 'Romaneio', 'Emitente', 'Destinatario', 
      'Transportadora', 'PesoB', 'QVol', 'vNF', 'cProd', 'xProd', 'qCom', 
      'Quantidade_Conferida', 'Status', 'vProd', 'uCom',
    ];

    let csv = '\ufeff' + headers.join(';') + '\n';
    groups.forEach((g) => {
      g.notes.forEach((n) => {
        n.items.forEach((it) => {
          const formatValue = (val) => {
            if (val === null || val === undefined) return '""';
            let str = val.toString();
            str = str.replace(/\n/g, ' ').replace(/"/g, '""');
            return `"${str}"`;
          };

          const row = [
            formatValue(g.emitFant), formatValue(g.city || ''), formatValue(n.nNF || ''),
            formatValue(n.dhEmi || ''), formatValue(n.Romaneio || ''), formatValue(n.emitName || ''),
            formatValue(n.destName || ''), formatValue(n.transportName || ''), formatValue(n.pesoB || ''),
            formatValue(n.qVol || ''), formatValue(n.vNF || ''), formatValue(it.cProd || ''),
            formatValue(it.xProd || ''), formatValue(it.qCom || ''), formatValue(it.Quantidade_Conferida || ''),
            formatValue(it.Status || ''), formatValue(it.vProd || ''), formatValue(it.uCom || ''),
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

  /* ------------------ Render ------------------ */
  return (
    // Fundo da tela mais clean e com padding generoso
    <div className="min-h-screen bg-gray-50"> 
        {/* Navbar simples para dar o ar de "Sistema" - Azul Marinho Friolog */}
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
        
        {/* Card de Upload e Ações - Mais robusto (fundo branco com sombra) */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-blue-100"> 
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className='flex items-center gap-4'>
                <div className="p-3 bg-blue-100 rounded-full border border-blue-300 flex-shrink-0">
                    <Package className="w-6 h-6 text-blue-800" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Conferência de Carga XML</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Importe arquivos XML (NF-e) para agrupar e iniciar a conferência de produtos.
                    </p>
                </div>
            </div>
            {/* Ações (Botões) */}
            <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 md:justify-end">
                <button
                  onClick={exportToCSV}
                  // Verde Esmeralda para Exportar/Sucesso
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={groups.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV ({groups.reduce((acc, g) => acc + g.totals.totalItems, 0)} itens)
                </button>

                <button
                  onClick={clearAll}
                  // Vermelho para Limpar
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

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <label className={`cursor-pointer w-full sm:w-auto`}>
                  <div className={`border-2 border-dashed rounded-lg p-3 flex items-center gap-4 min-w-[300px] transition duration-200 
                            ${fileNames.length > 0 ? 'bg-green-50 border-green-400 text-green-700' : 'bg-white border-blue-500 hover:bg-blue-50'}`}> 
                    <Upload className="w-5 h-5 text-blue-700 flex-shrink-0" /> 
                    <div>
                      <div className="font-semibold text-sm">
                        {fileNames.length > 0 ? `${fileNames.length} arquivo(s) XML carregado(s)` : 'Clique para Carregar ou Arraste arquivos XML'}
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
              
              {loading && <div className="text-sm text-blue-700 font-semibold flex items-center gap-2 animate-pulse ml-4"> 
                <div className="w-3 h-3 bg-blue-700 rounded-full"></div> Processando arquivos...
              </div>}
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-6 pt-4">
          {groups.length === 0 && !loading && ( // Garante que a mensagem apareça se não houver groups E não estiver carregando
            <div className="text-center text-gray-500 p-12 bg-white rounded-xl border border-gray-200 shadow-md">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-lg font-medium">Aguardando a importação dos XMLs...</p>
            </div>
          )}
          {/*
             O resto do código de renderização dos grupos (groups.map) permanece inalterado 
             e deve funcionar para exibir a tabela de conferência
          */}
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
                            <div className="flex-grow">
                                <div className="text-lg font-bold text-gray-800">
                                    NF: <span className="text-blue-700">{n.nNF}</span> 
                                    <span className="text-sm font-normal text-gray-500 ml-2">({n.dhEmi})</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    <span className="font-medium">Destinatário:</span> {n.destName} | 
                                    <span className="font-medium"> Transp:</span> {n.transportName || 'Não Informado'}
                                </div>
                                
                                {/* Campo Romaneio (NOVO) */}
                                <div className="mt-3 flex items-center gap-2">
                                    <label htmlFor={`romaneio-${g.key}-${ni}`} className="text-sm font-medium text-gray-700 flex-shrink-0">
                                        Romaneio:
                                    </label>
                                    <input
                                        id={`romaneio-${g.key}-${ni}`}
                                        type="text"
                                        value={n.Romaneio || ''}
                                        onChange={(ev) => handleRomaneioChange(g.key, ni, ev.target.value)}
                                        placeholder="Preencher..."
                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full lg:w-40"
                                        onClick={(e) => e.stopPropagation()} 
                                    />
                                </div>
                                
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3 lg:mt-0">
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm text-gray-500">Peso (NF)</div>
                                    <div className="font-bold text-gray-800">
                                        {n.pesoB ? Number(n.pesoB).toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : '0'} kg
                                    </div>
                                    <div className="text-xs text-gray-500">Vol: {n.qVol}</div>
                                </div>

                                <button
                                  onClick={() => toggleNoteOpen(g.key, ni)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition duration-150 
                                            ${n.open ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-md' : 'bg-white text-blue-700 border border-blue-500 hover:bg-blue-50'}`}
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
                                      <th className="px-3 py-2 font-bold">Produto</th>
                                      <th className="px-3 py-2 font-bold text-center">Qtd XML</th>
                                      <th className="px-3 py-2 font-bold text-center">Un</th>
                                      <th className="px-3 py-2 font-bold text-right">Valor Total (R$)</th>
                                      <th className="px-3 py-2 font-bold text-center w-40">Qtd Conferida</th>
                                      <th className="px-3 py-2 font-bold text-center">Status</th>
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
                                            <td className="px-3 py-3 align-top text-gray-800">{it.xProd || '-'}</td>
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