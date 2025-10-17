import React, { useState } from 'react';
// Apenas as importações necessárias (React e ícones)
import { Upload, Download, X, ClipboardCheck, FileText } from 'lucide-react'; 

export default function BateCargaXML() {
  const [records, setRecords] = useState([]);
  const [fileName, setFileName] = useState('');
  const [xmlData, setXmlData] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Estado para mensagens de erro

  const handleXMLUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null); // Limpa erros anteriores
    setLoading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const xmlString = event.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Verifica erro de análise do XML
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
          setError('Erro ao analisar o XML. Verifique se o arquivo está bem formatado.');
          setLoading(false);
          return;
        }

        setFileName(file.name.replace('.xml', ''));
        parseXML(xmlDoc);
      } catch (error) {
        console.error('Erro no upload:', error);
        setError('Erro ao processar o arquivo. Tente novamente ou verifique o formato.');
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const parseXML = (xmlDoc) => {
    const rows = xmlDoc.documentElement.children;
    const allFields = new Set();
    const parsedRecords = [];

    for (let row of rows) {
      const record = {};
      for (let field of row.children) {
        const fieldName = field.tagName;
        allFields.add(fieldName);
        record[fieldName] = field.textContent;
      }

      record['Quantidade_Conferida'] = '';
      record['Status'] = '';
      parsedRecords.push(record);
    }

    const fieldArray = Array.from(allFields).sort();
    setFields(fieldArray);
    setRecords(parsedRecords);
    setXmlData(xmlDoc);
    setLoading(false);
    
    if (parsedRecords.length === 0) {
        setError('Nenhum registro de item encontrado no XML. Verifique a estrutura.');
    }
  };

  const handleQuantidadeChange = (index, value) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index]['Quantidade_Conferida'] = value;

      // Lógica para encontrar a quantidade esperada
      const quantityKeys = ['QUANTIDADE', 'qtd', 'Qtd', 'quantidade', 'QNTD']; 
      let qtdEsperada = 0;
      for (const key of quantityKeys) {
          const val = parseFloat(updated[index][key] || 0);
          if (!isNaN(val) && val > 0) {
              qtdEsperada = val;
              break;
          }
      }
      
      const qtdConferida = parseFloat(value || 0);

      if (qtdConferida === qtdEsperada) {
        updated[index]['Status'] = 'OK';
      } else {
        updated[index]['Status'] = 'Divergente';
      }

      return updated;
    });
  };

  const exportToXLS = () => {
    if (records.length === 0) {
      setError('Nenhum registro para exportar.');
      return;
    }
    
    let xlsContent = '<table>';
    const headers = [...fields, 'Quantidade_Conferida', 'Status'];
    xlsContent += '<tr>';
    headers.forEach((field) => {
      xlsContent += `<td>${field}</td>`;
    });
    xlsContent += '</tr>';

    records.forEach((record) => {
      xlsContent += '<tr>';
      headers.forEach((field) => {
        const value = record[field] || '';
        xlsContent += `<td>${escapeHtml(value)}</td>`;
      });
      xlsContent += '</tr>';
    });

    xlsContent += '</table>';

    const blob = new Blob([xlsContent], {
      type: 'application/vnd.ms-excel',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'bate_carga'}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Função exportToPDF REMOVIDA
  
  const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  const clearData = () => {
    setRecords([]);
    setFields([]);
    setXmlData(null);
    setFileName('');
    setLoading(false);
    setError(null); // Limpa o erro ao limpar dados
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* TÍTULO E DESCRIÇÃO */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-blue-600" />
          Processo de Bate Carga
        </h1>
        <p className="text-gray-600 mb-6">
          Faça upload de um arquivo XML de nota ou manifesto e gere automaticamente o documento de separação e conferência.
        </p>

        {/* EXIBIÇÃO DE ERRO */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
            <p className="font-bold">Atenção!</p>
            <p>{error}</p>
          </div>
        )}

        {/* Upload */}
        <div className="mb-8">
          <label className="block">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-700 font-semibold">
                Clique para selecionar ou arraste seu arquivo XML
              </p>
              <input
                type="file"
                accept=".xml"
                onChange={handleXMLUpload}
                className="hidden"
              />
            </div>
          </label>
        </div>

        {loading && (
          <p className="text-blue-600 font-semibold text-center mb-4 animate-pulse">
            Processando XML...
          </p>
        )}

        {xmlData && !loading && (
          <>
            {/* Tabela */}
            <div className="mb-8 overflow-x-auto shadow-md rounded-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Itens da Carga ({records.length} registros)
              </h2>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    {fields.map((field) => (
                      <th
                        key={field}
                        className="border border-gray-300 px-4 py-2 text-left"
                      >
                        {field}
                      </th>
                    ))}
                    <th className="border border-gray-300 px-4 py-2 text-left min-w-[150px]">
                      Quantidade Conferida
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left min-w-[100px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {fields.map((field) => (
                        <td
                          key={field}
                          className="border border-gray-300 px-4 py-2"
                        >
                          {record[field] || '-'}
                        </td>
                      ))}
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="number"
                          value={record.Quantidade_Conferida}
                          onChange={(e) =>
                            handleQuantidadeChange(idx, e.target.value)
                          }
                          className="w-full border rounded p-1 text-center"
                        />
                      </td>
                      <td
                        className={`border border-gray-300 px-4 py-2 font-semibold ${
                          record.Status === 'OK'
                            ? 'text-green-600'
                            : record.Status === 'Divergente'
                            ? 'text-red-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {record.Status || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botões */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={exportToXLS}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                Exportar XLS
              </button>
              
              {/* Botão Gerar PDF REMOVIDO */}

              <button
                onClick={clearData}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                <X className="w-5 h-5" />
                Limpar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}