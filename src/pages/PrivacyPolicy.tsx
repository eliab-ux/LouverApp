import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { arrowBackOutline } from 'ionicons/icons'
import { useHistory } from 'react-router-dom'

export function PrivacyPolicy() {
  const history = useHistory()

  function voltar() {
    if (history.length > 1) {
      history.goBack()
    } else {
      history.replace('/login')
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" fill="clear" onClick={voltar} aria-label="Voltar">
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Política de Privacidade</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="max-w-2xl mx-auto pb-10">

          {/* Cabeçalho */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center px-6 py-8 mb-6">
            <div className="text-3xl mb-2">♫</div>
            <h1 className="text-xl font-bold mb-1">Política de Privacidade</h1>
            <p className="text-sm opacity-90">LouvorApp — Gestão de Louvor e Adoração</p>
            <p className="text-xs opacity-75 mt-2">Última atualização: 29 de janeiro de 2025 · Versão 1.0</p>
          </div>

          {/* Resumo executivo */}
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 mb-6">
            <h2 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Principais pontos</h2>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>✅ Seus dados são compartilhados <strong>apenas dentro da sua igreja</strong></li>
              <li>✅ <strong>Não vendemos</strong> seus dados para terceiros</li>
              <li>✅ Utilizamos <strong>criptografia</strong> e controles de acesso rigorosos</li>
              <li>✅ Você tem <strong>direito de acesso, correção e exclusão</strong> dos seus dados</li>
              <li>✅ Backend hospedado no <strong>Supabase</strong> com segurança empresarial</li>
            </ul>
          </div>

          <Secao titulo="Dados que Coletamos">
            <SubSecao titulo="Dados de cadastro">
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Nome completo, e-mail, telefone (opcional)</li>
                <li>Senha (armazenada com criptografia)</li>
                <li>Papel na equipe (administrador, líder, membro)</li>
                <li>Igreja vinculada</li>
              </ul>
            </SubSecao>
            <SubSecao titulo="Dados de uso do aplicativo">
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Disponibilidade para escalas</li>
                <li>Funções e ministérios</li>
                <li>Músicas cadastradas</li>
                <li>Escalas e eventos</li>
                <li>Histórico de participação</li>
              </ul>
            </SubSecao>
          </Secao>

          <Secao titulo="Como Usamos Seus Dados">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>Gerenciar sua conta e autenticação</li>
              <li>Criar e gerenciar escalas de louvor</li>
              <li>Facilitar comunicação entre membros da equipe</li>
              <li>Enviar notificações sobre escalas e eventos</li>
              <li>Melhorar o aplicativo e desenvolver novos recursos</li>
            </ul>
          </Secao>

          <Secao titulo="Compartilhamento de Dados">
            <SubSecao titulo="✅ Compartilhamos com:">
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li><strong>Membros da sua igreja</strong> — conforme os níveis de acesso</li>
                <li><strong>Supabase</strong> — infraestrutura de backend e banco de dados</li>
                <li><strong>Serviços de e-mail</strong> — para notificações e convites</li>
              </ul>
            </SubSecao>
            <SubSecao titulo="❌ NÃO compartilhamos com:">
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Outras igrejas ou organizações</li>
                <li>Empresas de publicidade</li>
                <li>Terceiros para fins comerciais</li>
                <li>Redes sociais (sem sua autorização)</li>
              </ul>
            </SubSecao>
          </Secao>

          <Secao titulo="Segurança">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>🔒 <strong>Criptografia SSL/HTTPS</strong> em todas as comunicações</li>
              <li>🔑 <strong>Senhas criptografadas</strong> (hash bcrypt)</li>
              <li>🛡️ <strong>Row-Level Security (RLS)</strong> no banco de dados</li>
              <li>💾 <strong>Backups automáticos</strong> regulares</li>
              <li>👁️ <strong>Monitoramento</strong> de atividades suspeitas</li>
            </ul>
          </Secao>

          <Secao titulo="Seus Direitos (LGPD)">
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Acessar</strong> seus dados pessoais</li>
              <li><strong>Corrigir</strong> dados incorretos ou desatualizados</li>
              <li><strong>Excluir</strong> seus dados (direito ao esquecimento)</li>
              <li><strong>Portabilidade</strong> — receber dados em formato estruturado</li>
              <li><strong>Revogar</strong> consentimento a qualquer momento</li>
              <li><strong>Opor-se</strong> ao tratamento de dados</li>
              <li><strong>Saber</strong> com quem compartilhamos seus dados</li>
            </ol>
            <div className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-sm">
              <p className="text-slate-700 dark:text-slate-300">
                Para exercer seus direitos, entre em contato pelo e-mail:{' '}
                <strong>privacidade@louvorapp.com.br</strong><br />
                <span className="text-xs text-slate-500">Prazo de resposta: até 15 dias úteis.</span>
              </p>
            </div>
          </Secao>

          <Secao titulo="Retenção de Dados">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Conta ativa:</strong> enquanto você usar o aplicativo</li>
              <li><strong>Histórico de escalas:</strong> até 5 anos</li>
              <li><strong>Logs de segurança:</strong> até 6 meses</li>
              <li><strong>Contas inativas:</strong> excluídas após 2 anos (com notificação prévia)</li>
            </ul>
          </Secao>

          <Secao titulo="Cookies">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Essenciais:</strong> manter sua sessão de login</li>
              <li><strong>Preferências:</strong> lembrar tema (claro/escuro)</li>
              <li><strong>Analíticos:</strong> entender como você usa o app (dados anônimos)</li>
            </ul>
          </Secao>

          <Secao titulo="Menores de Idade">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
              O LouvorApp não é destinado a menores de 18 anos sem autorização dos pais ou responsáveis legais.
            </div>
          </Secao>

          <Secao titulo="Contato">
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 text-sm space-y-1 text-slate-700 dark:text-slate-300">
              <p><strong>Responsável:</strong> PSI Equipamentos</p>
              <p><strong>E-mail de privacidade:</strong> privacidade@louvorapp.com.br</p>
              <p><strong>Prazo de resposta:</strong> até 15 dias úteis</p>
            </div>
          </Secao>

          <Secao titulo="Legislação Aplicável">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>LGPD — Lei nº 13.709/2018</li>
              <li>Marco Civil da Internet — Lei nº 12.965/2014</li>
              <li>Código de Defesa do Consumidor — Lei nº 8.078/1990</li>
            </ul>
          </Secao>

          <Secao titulo="Alterações nesta Política">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Esta política pode ser atualizada periodicamente. Notificaremos você por e-mail e no aplicativo sobre alterações importantes.
            </p>
          </Secao>

          {/* Rodapé */}
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 text-center text-sm text-indigo-700 dark:text-indigo-300">
            Ao utilizar o LouvorApp, você reconhece que leu e concorda com esta Política de Privacidade.
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Versão 1.0 · 29 de janeiro de 2025<br />
            © {new Date().getFullYear()} LouvorApp (PSI Equipamentos)
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 border-b border-indigo-200 dark:border-indigo-800 pb-1 mb-3">
        {titulo}
      </h2>
      {children}
    </div>
  )
}

function SubSecao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{titulo}</h3>
      {children}
    </div>
  )
}
