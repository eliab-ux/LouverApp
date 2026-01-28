import { useState } from 'react'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonText,
  useIonRouter,
} from '@ionic/react'
import { downloadOutline, cloudUploadOutline, checkmarkCircleOutline } from 'ionicons/icons'
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
  const router = useIonRouter()
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
      const { data: entRow, error: entError } = await supabase
        .from('igreja_entitlement')
        .select('plano, limite_musicas, is_blocked')
        .eq('igreja_id', user.igrejaId)
        .maybeSingle()

      if (entError) {
        setImportError('Erro ao verificar o plano da igreja.')
        return
      }

      if (entRow?.is_blocked) {
        setImportError('Igreja suspensa. Importacao bloqueada.')
        return
      }

      const limite = entRow?.limite_musicas ?? null
      if (entRow?.plano === 'free' && typeof limite === 'number') {
        const { count: totalMusicas, error: countError } = await supabase
          .from('musicas')
          .select('*', { count: 'exact', head: true })
          .eq('igreja_id', user.igrejaId)

        if (countError) {
          setImportError('Erro ao verificar limite de musicas.')
          return
        }

        const totalAtual = totalMusicas ?? 0
        const restante = limite - totalAtual
        if (restante <= 0) {
          setImportError(`Limite do plano Free: ${limite} musicas. Nenhuma vaga disponivel.`)
          window.setTimeout(() => router.push('/app/assinatura', 'forward', 'push'), 600)
          return
        }

        if (csvData.length > restante) {
          setImportError(`Limite do plano Free: ${limite} musicas. Restante para importar: ${restante}.`)
          window.setTimeout(() => router.push('/app/assinatura', 'forward', 'push'), 600)
          return
        }
      }

      let text = await file.text()

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

      const categoriasCache = new Map<string, string>()
      const momentosCache = new Map<string, string>()
      const estilosCache = new Map<string, string>()

      categorias.forEach((c) => categoriasCache.set(c.nome.toLowerCase(), c.id))
      momentos.forEach((m) => momentosCache.set(m.nome.toLowerCase(), m.id))
      estilos.forEach((e) => estilosCache.set(e.nome.toLowerCase(), e.id))

      let importadas = 0
      let erros = 0

      for (const row of csvData) {
        const nome = row[nomeIdx]?.trim()
        if (!nome) continue

        try {
          const tonsStr = tonsIdx >= 0 ? row[tonsIdx]?.trim() : ''
          const tons = tonsStr ? tonsStr.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean) : null

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

          const bpmStr = bpmIdx >= 0 ? row[bpmIdx]?.trim() : ''
          const bpm = bpmStr ? parseInt(bpmStr, 10) : null

          const vsStr = vsIdx >= 0 ? row[vsIdx]?.trim().toLowerCase() : ''
          const possuiVs = vsStr === 'sim' || vsStr === 's' || vsStr === 'true' || vsStr === '1'

          const link = linkIdx >= 0 ? row[linkIdx]?.trim() : null

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

      onCategoriasChange()
      onMomentosChange()
      onEstilosChange()

      if (importadas > 0) {
        setImportSuccess(`${importadas} música(s) importada(s) com sucesso!${erros > 0 ? ` (${erros} erro(s))` : ''}`)
      } else {
        setImportError(`Nenhuma música foi importada. ${erros} erro(s) encontrado(s).`)
      }

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
    <div className="space-y-4">
      <IonCard className="m-0">
        <IonCardHeader>
          <IonCardTitle className="text-base">Importar CSV</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p className="text-sm mb-3">Importe músicas em lote e crie categorias/momentos/estilos automaticamente</p>
          </IonText>

          {/* Botão Baixar Template */}
          <div className="mb-4">
            <IonButton fill="outline" size="small" onClick={gerarTemplateCSV}>
              <IonIcon slot="start" icon={downloadOutline} />
              Baixar Template
            </IonButton>
          </div>

          {/* Instruções - Como funciona */}
          <div className="mb-4">
            <IonText color="dark">
              <p className="text-sm font-semibold mb-2">Como funciona</p>
            </IonText>
            <IonList lines="none" className="py-0">
              <IonItem className="text-xs">
                <IonLabel className="ion-text-wrap">
                  <IonText color="medium">
                    <p>1. O arquivo deve ser CSV com separador <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">;</code></p>
                  </IonText>
                </IonLabel>
              </IonItem>
              <IonItem className="text-xs">
                <IonLabel className="ion-text-wrap">
                  <IonText color="medium">
                    <p>2. A primeira linha deve conter os cabeçalhos das colunas</p>
                  </IonText>
                </IonLabel>
              </IonItem>
              <IonItem className="text-xs">
                <IonLabel className="ion-text-wrap">
                  <IonText color="medium">
                    <p>3. Coluna obrigatória: <strong>nome</strong></p>
                  </IonText>
                </IonLabel>
              </IonItem>
              <IonItem className="text-xs">
                <IonLabel className="ion-text-wrap">
                  <IonText color="medium">
                    <p>4. Colunas opcionais: tons, categoria, momento, estilo, bpm, possui_vs, link</p>
                  </IonText>
                </IonLabel>
              </IonItem>
              <IonItem className="text-xs">
                <IonLabel className="ion-text-wrap">
                  <IonText color="medium">
                    <p>5. Tons separados por vírgula (ex: <strong>C,G,D</strong>)</p>
                  </IonText>
                </IonLabel>
              </IonItem>
              <IonItem className="text-xs">
                <IonLabel className="ion-text-wrap">
                  <IonText color="medium">
                    <p>6. Categorias, momentos e estilos serão <strong>criados automaticamente</strong></p>
                  </IonText>
                </IonLabel>
              </IonItem>
              <IonItem className="text-xs">
                <IonLabel className="ion-text-wrap">
                  <IonText color="medium">
                    <p>7. Para <strong>possui_vs</strong>, use: sim, s, true ou 1</p>
                  </IonText>
                </IonLabel>
              </IonItem>
            </IonList>
          </div>

          {/* Upload de arquivo */}
          <div className="mb-4">
            <IonLabel className="text-sm font-medium mb-2 block">Selecione o arquivo CSV</IonLabel>
            <input
              id="csvFileInput"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
            />
            {arquivoNome && (
              <IonNote className="block mt-2">
                {csvData.length > 0 ? <IonIcon icon={checkmarkCircleOutline} color="success" /> : '📄'} {arquivoNome}
              </IonNote>
            )}
          </div>

          {/* Preview dos dados */}
          {csvData.length > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="text-sm">Preview ({csvData.length} linha(s) para importar)</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {csvHeaders.map((header, i) => (
                          <th key={i} className="px-2 py-2 text-left font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-2 py-2 truncate max-w-[150px]">
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <IonNote className="block mt-2">... e mais {csvData.length - 5} linha(s)</IonNote>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Mensagens */}
          {importError && (
            <IonText color="danger">
              <p className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mb-4">
                {importError}
              </p>
            </IonText>
          )}
          {importSuccess && (
            <IonText color="success">
              <p className="text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 mb-4">
                {importSuccess}
              </p>
            </IonText>
          )}

          {/* Botão de importar */}
          {csvData.length > 0 && (
            <IonButton expand="block" onClick={importarMusicas} disabled={importando}>
              <IonIcon slot="start" icon={cloudUploadOutline} />
              {importando ? 'Importando...' : `Importar ${csvData.length} música(s)`}
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  )
}
