import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { AppUser, Categoria, MomentoCulto, Estilo } from '../../types'

interface ImportarCSVPanelProps {
  user: AppUser
  categorias: Categoria[]
  momentos: MomentoCulto[]
  estilos: Estilo[]
  onCategoriasChange: () => void
  onMomentosChange: () => void
  onEstilosChange: () => void
}

export function ImportarCSVPanel({
  user,
  categorias,
  momentos,
  estilos,
  onCategoriasChange,
  onMomentosChange,
  onEstilosChange,
}: ImportarCSVPanelProps) {
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [importando, setImportando] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [arquivoNome, setArquivoNome] = useState<string>('')

  const gerarTemplateCSV = () => {
    const template =
      'nome;tons;categoria;momento;estilo;bpm;possui_vs;link\n' +
      'Grande é o Senhor;C,G,D;Louvor;Abertura;Contemporâneo;120;sim;https://youtube.com/...\n' +
      'Quão Grande é o Meu Deus;E,A;Adoração;Ministração;Tradicional;80;não;\n'

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_musicas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    return lines.map((line) => {
      // Suporta tanto ; quanto , como separador (detecta automaticamente)
      const separator = line.includes(';') ? ';' : ','
      return line.split(separator).map((cell) => cell.trim().replace(/^["']|["']$/g, ''))
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(null)
    setArquivoNome(file.name)

    try {
      // Tenta ler como UTF-8 primeiro
      let text = await file.text()

      // Se detectar caracteres estranhos, tenta com encoding diferente
      if (text.includes('�') || text.includes('Ã')) {
        const buffer = await file.arrayBuffer()
        const decoder = new TextDecoder('iso-8859-1')
        text = decoder.decode(buffer)
      }

      const parsed = parseCSV(text)
      if (parsed.length < 2) {
        setImportError('O arquivo deve ter pelo menos o cabeçalho e uma linha de dados.')
        setCsvHeaders([])
        setCsvData([])
        return
      }

      setCsvHeaders(parsed[0])
      setCsvData(parsed.slice(1))
    } catch (e) {
      console.error('Erro ao ler arquivo:', e)
      setImportError('Erro ao ler o arquivo CSV.')
      setCsvHeaders([])
      setCsvData([])
    }
  }

  const importarMusicas = async () => {
    if (csvData.length === 0) {
      setImportError('Nenhum dado para importar.')
      return
    }

    setImportando(true)
    setImportError(null)
    setImportSuccess(null)

    try {
      // Mapeia índices das colunas
      const headerLower = csvHeaders.map((h) => h.toLowerCase().trim())
      const nomeIdx = headerLower.findIndex((h) => h === 'nome' || h === 'título' || h === 'titulo')
      const tonsIdx = headerLower.findIndex((h) => h === 'tons' || h === 'tom' || h === 'tonalidade')
      const categoriaIdx = headerLower.findIndex((h) => h === 'categoria')
      const momentoIdx = headerLower.findIndex((h) => h === 'momento')
      const estiloIdx = headerLower.findIndex((h) => h === 'estilo')
      const bpmIdx = headerLower.findIndex((h) => h === 'bpm')
      const vsIdx = headerLower.findIndex((h) => h === 'possui_vs' || h === 'vs' || h === 'playback')
      const linkIdx = headerLower.findIndex((h) => h === 'link' || h === 'url' || h === 'links')

      if (nomeIdx === -1) {
        setImportError('Coluna "nome" não encontrada no CSV.')
        return
      }

      // Cache local para categorias/momentos/estilos criados durante a importação
      const categoriasCache = new Map<string, string>()
      const momentosCache = new Map<string, string>()
      const estilosCache = new Map<string, string>()

      // Preenche cache com dados existentes
      categorias.forEach((c) => categoriasCache.set(c.nome.toLowerCase(), c.id))
      momentos.forEach((m) => momentosCache.set(m.nome.toLowerCase(), m.id))
      estilos.forEach((e) => estilosCache.set(e.nome.toLowerCase(), e.id))

      let importadas = 0
      let erros = 0

      for (const row of csvData) {
        const nome = row[nomeIdx]?.trim()
        if (!nome) continue

        try {
          // Processa tons (separados por vírgula)
          const tonsStr = tonsIdx >= 0 ? row[tonsIdx]?.trim() : ''
          const tons = tonsStr
            ? tonsStr.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
            : null

          // Processa categoria (cria se não existir)
          let categoriaId: string | null = null
          const categoriaNome = categoriaIdx >= 0 ? row[categoriaIdx]?.trim() : ''
          if (categoriaNome) {
            const cacheKey = categoriaNome.toLowerCase()
            if (categoriasCache.has(cacheKey)) {
              categoriaId = categoriasCache.get(cacheKey)!
            } else {
              const { data: novaCat } = await supabase
                .from('categorias')
                .insert({ nome: categoriaNome, igreja_id: user.igrejaId })
                .select('id')
                .single()
              if (novaCat) {
                categoriaId = novaCat.id
                categoriasCache.set(cacheKey, novaCat.id)
              }
            }
          }

          // Processa momento (cria se não existir)
          let momentoId: string | null = null
          const momentoNome = momentoIdx >= 0 ? row[momentoIdx]?.trim() : ''
          if (momentoNome) {
            const cacheKey = momentoNome.toLowerCase()
            if (momentosCache.has(cacheKey)) {
              momentoId = momentosCache.get(cacheKey)!
            } else {
              const { data: novoMom } = await supabase
                .from('momentos_culto')
                .insert({ nome: momentoNome, igreja_id: user.igrejaId })
                .select('id')
                .single()
              if (novoMom) {
                momentoId = novoMom.id
                momentosCache.set(cacheKey, novoMom.id)
              }
            }
          }

          // Processa estilo (cria se não existir)
          let estiloId: string | null = null
          const estiloNome = estiloIdx >= 0 ? row[estiloIdx]?.trim() : ''
          if (estiloNome) {
            const cacheKey = estiloNome.toLowerCase()
            if (estilosCache.has(cacheKey)) {
              estiloId = estilosCache.get(cacheKey)!
            } else {
              const { data: novoEst } = await supabase
                .from('estilos')
                .insert({ nome: estiloNome, igreja_id: user.igrejaId })
                .select('id')
                .single()
              if (novoEst) {
                estiloId = novoEst.id
                estilosCache.set(cacheKey, novoEst.id)
              }
            }
          }

          // Processa BPM
          const bpmStr = bpmIdx >= 0 ? row[bpmIdx]?.trim() : ''
          const bpm = bpmStr ? parseInt(bpmStr, 10) : null

          // Processa possui_vs
          const vsStr = vsIdx >= 0 ? row[vsIdx]?.trim().toLowerCase() : ''
          const possuiVs = vsStr === 'sim' || vsStr === 's' || vsStr === 'true' || vsStr === '1'

          // Processa link
          const link = linkIdx >= 0 ? row[linkIdx]?.trim() : null

          // Insere a música
          const { error: insertError } = await supabase.from('musicas').insert({
            nome,
            tons: tons && tons.length > 0 ? tons : null,
            categoria_principal_id: categoriaId,
            momento_culto_id: momentoId,
            estilo_id: estiloId,
            bpm: bpm && !isNaN(bpm) ? bpm : null,
            possui_vs: possuiVs,
            links: link || null,
            igreja_id: user.igrejaId,
          })

          if (insertError) {
            console.error('Erro ao inserir música:', nome, insertError)
            erros++
          } else {
            importadas++
          }
        } catch (e) {
          console.error('Erro ao processar linha:', row, e)
          erros++
        }
      }

      // Atualiza listas se criou novos itens
      onCategoriasChange()
      onMomentosChange()
      onEstilosChange()

      if (importadas > 0) {
        setImportSuccess(
          `${importadas} música(s) importada(s) com sucesso!${erros > 0 ? ` (${erros} erro(s))` : ''}`
        )
      } else {
        setImportError(`Nenhuma música foi importada. ${erros} erro(s) encontrado(s).`)
      }

      // Limpa o formulário
      setCsvData([])
      setCsvHeaders([])
      const fileInput = document.getElementById('csvFileInput') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (e) {
      console.error('Erro na importação:', e)
      setImportError('Erro ao importar músicas.')
    } finally {
      setImportando(false)
    }
  }

  return (
    <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Importar CSV</h2>
          <p className="text-[11px] text-slate-400">Importe músicas em lote e crie categorias/momentos/estilos automaticamente</p>
        </div>
        <button
          type="button"
          onClick={gerarTemplateCSV}
          className="inline-flex items-center justify-center rounded-xl border border-emerald-600/70 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15"
        >
          ⬇️ Baixar template
        </button>
      </div>

      <div className="space-y-4">
        {/* Instruções */}
        <div className="rounded-2xl bg-slate-950/30 p-4 shadow-sm ring-1 ring-slate-800/60">
          <h3 className="text-xs font-semibold text-slate-200 mb-2">Como funciona</h3>
          <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
            <li>
              O arquivo deve ser CSV com separador <code className="bg-slate-900 px-1 rounded">;</code>
            </li>
            <li>A primeira linha deve conter os cabeçalhos das colunas</li>
            <li>
              Coluna obrigatória: <span className="font-semibold text-slate-100">nome</span>
            </li>
            <li>Colunas opcionais: tons, categoria, momento, estilo, bpm, possui_vs, link</li>
            <li>
              Tons separados por vírgula (ex: <span className="font-semibold">C,G,D</span>)
            </li>
            <li>
              Categorias, momentos e estilos serão <span className="font-semibold">criados automaticamente</span>
            </li>
            <li>
              Para <span className="font-semibold">possui_vs</span>, use: sim, s, true ou 1
            </li>
          </ol>
        </div>

        {/* Upload de arquivo */}
        <div className="rounded-2xl bg-slate-950/30 p-4 shadow-sm ring-1 ring-slate-800/60">
          <label className="block text-xs font-medium text-slate-200 mb-2" htmlFor="csvFileInput">
            Selecione o arquivo CSV
          </label>
          <input
            id="csvFileInput"
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-slate-900 hover:file:bg-emerald-400 file:cursor-pointer"
          />
          <div className="mt-2 text-[11px] text-slate-400">
            {arquivoNome ? (
              <span>
                {csvData.length > 0 ? '✅' : '📄'} {arquivoNome}
              </span>
            ) : (
              <span>Nenhum arquivo selecionado.</span>
            )}
          </div>
        </div>

        {/* Preview dos dados */}
        {csvData.length > 0 && (
          <div className="rounded-2xl bg-slate-950/30 p-4 shadow-sm ring-1 ring-slate-800/60">
            <h3 className="text-xs font-semibold text-slate-300 mb-2">
              Preview ({csvData.length} linha(s) para importar)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-slate-300">
                <thead>
                  <tr className="border-b border-slate-700">
                    {csvHeaders.map((header, i) => (
                      <th key={i} className="px-2 py-1 text-left font-semibold text-emerald-400">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-700/50">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-2 py-1 truncate max-w-[150px]">
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 5 && (
                <p className="text-[10px] text-slate-500 mt-2">
                  ... e mais {csvData.length - 5} linha(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mensagens de erro/sucesso */}
        {importError && (
          <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
            {importError}
          </p>
        )}
        {importSuccess && (
          <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-md px-3 py-2">
            {importSuccess}
          </p>
        )}

        {/* Botão de importar */}
        {csvData.length > 0 && (
          <button
            type="button"
            onClick={importarMusicas}
            disabled={importando}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {importando ? 'Importando...' : `Importar ${csvData.length} música(s)`}
          </button>
        )}
      </div>
    </section>
  )
}
