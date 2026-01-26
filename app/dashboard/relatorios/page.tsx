'use client'

import { useState, useEffect } from 'react'
import ModalDownloadRelatorio from '@/components/ModalDownloadRelatorio'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync } from '@/hooks/useDataSync'

type Militar = {
  id: string
  nomeCompleto: string
  status: 'Ativo' | 'Suspenso' | 'Exonerado'
  cargo?: string
  cargoNome?: string
}

type Cargo = {
  id: string
  nome: string
  nivel: number
  cor: string
}

type Evento = {
  id: string
  militarId: string
  classificacao: string
}

type Acao = {
  id: string
  militarId: string
  militarNome?: string
  tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
}

type Infracao = {
  id: string
  nome: string
  descricao: string
  gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
}

type Punicao = {
  id: string
  nome: string
  descricao: string
  pontos: number
}

type Prova = {
  id: string
  nomeConscrito: string
  nomeInstrutor: string
  questoes: Array<{ id: string; numero: number; texto: string; categoria: string }>
  dataCriacao: string
  horaCriacao: string
  pontuacaoMinima: number
  avaliacoes?: Record<string, 'correto' | 'incorreto' | null>
  finalizada?: boolean
  dataFinalizacao?: string
  horaFinalizacao?: string
}

type Aba = 'Militares' | 'Cargos' | 'Desempenho' | 'Ações' | 'Infrações' | 'Punições' | 'Recrutamento'

export default function RelatoriosPage() {
  const { isAdmin, temPermissao } = usePermissions()
  const [isClient, setIsClient] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<Aba>('Militares')
  
  const podeVer = isAdmin || temPermissao('view_relatorios')
  const podeBaixar = isAdmin || temPermissao('edit_relatorios')
  const [filtroCargo, setFiltroCargo] = useState<string>('Todos')
  const [filtroInfracao, setFiltroInfracao] = useState<string>('Todas')
  const [filtroPunicao, setFiltroPunicao] = useState<string>('Todas')
  const [ordenacaoDesempenho, setOrdenacaoDesempenho] = useState<string>('Mais Positivos')
  const [isModalDownloadOpen, setIsModalDownloadOpen] = useState(false)
  const [erroDownload, setErroDownload] = useState<string | null>(null)

  // Sincronização via API
  const { data: militares } = useDataSync<Militar>({ 
    entity: 'militares',
    pollingInterval: 2000
  })
  const { data: cargos } = useDataSync<Cargo>({ 
    entity: 'cargos',
    pollingInterval: 2000
  })
  const { data: eventos } = useDataSync<Evento>({ 
    entity: 'eventos',
    pollingInterval: 2000
  })
  const { data: acoes } = useDataSync<Acao>({ 
    entity: 'acoes',
    pollingInterval: 2000
  })
  const { data: infracoes } = useDataSync<Infracao>({ 
    entity: 'infracoes',
    pollingInterval: 2000
  })
  const { data: punicoes } = useDataSync<Punicao>({ 
    entity: 'punicoes',
    pollingInterval: 2000
  })
  const { data: provas } = useDataSync<Prova>({ 
    entity: 'provas',
    pollingInterval: 2000
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calcular estatísticas de militares
  const militaresComStatus = militares.filter(m => m.status === 'Ativo' || m.status === 'Suspenso' || m.status === 'Exonerado')
  const totalMilitares = militaresComStatus.length
  const militaresAtivos = militaresComStatus.filter(m => m.status === 'Ativo').length
  const militaresSuspensos = militaresComStatus.filter(m => m.status === 'Suspenso').length
  const militaresExonerados = militaresComStatus.filter(m => m.status === 'Exonerado').length

  const percentualAtivos = totalMilitares > 0 ? Math.round((militaresAtivos / totalMilitares) * 100) : 0
  const percentualSuspensos = totalMilitares > 0 ? Math.round((militaresSuspensos / totalMilitares) * 100) : 0
  const percentualExonerados = totalMilitares > 0 ? Math.round((militaresExonerados / totalMilitares) * 100) : 0

  // Calcular militares ativos por cargo
  const militaresPorCargo = cargos.map(cargo => {
    const militaresNoCargo = militares.filter(m => m.status === 'Ativo' && m.cargo === cargo.id)
    return {
      cargo,
      quantidade: militaresNoCargo.length,
    }
  }).filter(item => filtroCargo === 'Todos' || item.cargo.id === filtroCargo)
    .sort((a, b) => b.cargo.nivel - a.cargo.nivel)

  // Calcular desempenho (Top 10)
  const desempenhoPorMilitar = militares.map(militar => {
    const eventosDoMilitar = eventos.filter(e => e.militarId === militar.id)
    const eventosPositivos = eventosDoMilitar.filter(e => e.classificacao === 'Positivo').length
    const eventosNegativos = eventosDoMilitar.filter(e => e.classificacao === 'Negativo').length
    const totalAcoes = acoes.filter(a => a.militarId === militar.id).length

    return {
      militar,
      eventosPositivos,
      eventosNegativos,
      totalAcoes,
      totalEventos: eventosDoMilitar.length,
    }
  })

  const top10Desempenho = [...desempenhoPorMilitar]
    .sort((a, b) => {
      if (ordenacaoDesempenho === 'Mais Positivos') {
        return b.eventosPositivos - a.eventosPositivos || b.totalEventos - a.totalEventos
      } else if (ordenacaoDesempenho === 'Mais Negativos') {
        return b.eventosNegativos - a.eventosNegativos || b.totalEventos - a.totalEventos
      } else {
        return b.totalAcoes - a.totalAcoes || b.totalEventos - a.totalEventos
      }
    })
    .slice(0, 10)

  // Calcular ações por militar (Top 10)
  const acoesPorMilitar = militares.map(militar => {
    const acoesDoMilitar = acoes.filter(a => a.militarId === militar.id)
    const prisoes = acoesDoMilitar.filter(a => a.tipo === 'Prisão').length
    const cursos = acoesDoMilitar.filter(a => a.tipo === 'Curso').length
    const totalAcoes = acoesDoMilitar.length

    return {
      militar,
      prisoes,
      cursos,
      totalAcoes,
    }
  })

  const top10Acoes = [...acoesPorMilitar]
    .sort((a, b) => b.totalAcoes - a.totalAcoes)
    .slice(0, 10)

  // Filtrar infrações
  const infracoesFiltradas = (infracoes || []).filter(i => 
    filtroInfracao === 'Todas' || i.gravidade === filtroInfracao
  )

  // Filtrar punições
  const punicoesFiltradas = punicoes || []

  // Calcular estatísticas de recrutamento
  const totalProvas = provas.length
  const provasFinalizadas = provas.filter(p => p.finalizada).length
  const provasPendentes = provas.filter(p => !p.finalizada).length
  const provasAprovadas = provas.filter(p => {
    if (!p.finalizada) return false
    const totalCorretas = Object.values(p.avaliacoes || {}).filter(a => a === 'correto').length
    return totalCorretas >= p.pontuacaoMinima
  }).length
  const provasReprovadas = provas.filter(p => {
    if (!p.finalizada) return false
    const totalCorretas = Object.values(p.avaliacoes || {}).filter(a => a === 'correto').length
    return totalCorretas < p.pontuacaoMinima
  }).length

  const taxaAprovacao = provasFinalizadas > 0 ? Math.round((provasAprovadas / provasFinalizadas) * 100) : 0
  const taxaReprovacao = provasFinalizadas > 0 ? Math.round((provasReprovadas / provasFinalizadas) * 100) : 0

  const abas: Aba[] = ['Militares', 'Cargos', 'Desempenho', 'Ações', 'Infrações', 'Punições', 'Recrutamento']

  const getGravidadeColor = (gravidade: string) => {
    switch (gravidade) {
      case 'Leve':
        return 'bg-yellow-100 text-yellow-800'
      case 'Média':
        return 'bg-orange-100 text-orange-800'
      case 'Grave':
        return 'bg-red-100 text-red-800'
      case 'Gravíssima':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!podeVer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Função para gerar PDF simples (apenas aba atual)
  const gerarPDFSimples = async () => {
    try {
      setErroDownload(null)
      
      if (typeof window === 'undefined') {
        throw new Error('Função disponível apenas no navegador')
      }

      // Importação dinâmica - versão 5.x usa autoTable como função separada
      const jsPDFModule = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')
      
      const jsPDF = jsPDFModule.default
      // Na versão 5.x, autoTable é exportado como default
      const autoTable = (autoTableModule as any).default
      
      const doc = new jsPDF()
      
      // Verificar se autoTable está disponível
      if (typeof autoTable !== 'function') {
        console.error('autoTableModule keys:', Object.keys(autoTableModule))
        console.error('autoTableModule:', autoTableModule)
        throw new Error('jspdf-autotable não foi carregado. Tipo recebido: ' + typeof autoTable)
      }
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 20

      // Cabeçalho
      doc.setFontSize(20)
      doc.setTextColor(34, 197, 94) // Verde
      doc.text('Relatório de Relatórios', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      doc.setFontSize(12)
      doc.setTextColor(107, 114, 128) // Cinza
      doc.text(`Aba: ${abaAtiva}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8

      const dataAtual = new Date().toLocaleDateString('pt-BR')
      doc.text(`Data: ${dataAtual}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Conteúdo baseado na aba ativa
      if (abaAtiva === 'Militares') {
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Militares Ativos', 14, yPosition)
        yPosition += 10

        const tableData = [
          ['Status', 'Quantidade', 'Percentual'],
          ['Ativo', militaresAtivos.toString(), `${percentualAtivos}%`],
          ['Suspenso', militaresSuspensos.toString(), `${percentualSuspensos}%`],
          ['Exonerado', militaresExonerados.toString(), `${percentualExonerados}%`],
          ['Total', totalMilitares.toString(), '100%'],
        ]

        autoTable(doc, {
          startY: yPosition,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        })
      } else if (abaAtiva === 'Cargos') {
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Militares Ativos por Cargo', 14, yPosition)
        yPosition += 10

        const tableData = militaresPorCargo.map(item => [
          item.cargo.nome,
          item.cargo.nivel.toString(),
          item.quantidade.toString(),
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Cargo', 'Nível Hierárquico', 'Militares Ativos']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        })
      } else if (abaAtiva === 'Desempenho') {
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Top 10 - Desempenho', 14, yPosition)
        yPosition += 10

        const tableData = top10Desempenho.map((item, index) => [
          (index + 1).toString(),
          item.militar.nomeCompleto,
          item.militar.cargoNome || 'N/A',
          item.eventosPositivos.toString(),
          item.eventosNegativos.toString(),
          item.totalAcoes.toString(),
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Nome', 'Cargo', 'Eventos Positivos', 'Eventos Negativos', 'Total Ações']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        })
      } else if (abaAtiva === 'Ações') {
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Top 10 - Ações Operacionais', 14, yPosition)
        yPosition += 10

        const tableData = top10Acoes.map((item, index) => [
          (index + 1).toString(),
          item.militar.nomeCompleto,
          item.militar.cargoNome || 'N/A',
          item.prisoes.toString(),
          item.cursos.toString(),
          item.totalAcoes.toString(),
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Nome', 'Cargo', 'Prisões', 'Cursos', 'Total Ações']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        })
      } else if (abaAtiva === 'Infrações') {
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Infrações Cadastradas', 14, yPosition)
        yPosition += 10

        const tableData = infracoesFiltradas.map(item => [
          item.nome,
          item.gravidade,
          item.descricao.length > 50 ? item.descricao.substring(0, 50) + '...' : item.descricao,
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Nome', 'Gravidade', 'Descrição']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          columnStyles: { 2: { cellWidth: 100 } },
        })
      } else if (abaAtiva === 'Punições') {
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Punições Cadastradas', 14, yPosition)
        yPosition += 10

        const tableData = punicoesFiltradas.map(item => [
          item.nome,
          item.pontos.toString() + ' pts',
          item.descricao.length > 50 ? item.descricao.substring(0, 50) + '...' : item.descricao,
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Nome', 'Pontos', 'Descrição']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          columnStyles: { 2: { cellWidth: 100 } },
        })
      } else if (abaAtiva === 'Recrutamento') {
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Relatório de Recrutamento', 14, yPosition)
        yPosition += 10

        const tableDataEstatisticas = [
          ['Métrica', 'Quantidade'],
          ['Total de Provas', totalProvas.toString()],
          ['Provas Finalizadas', provasFinalizadas.toString()],
          ['Provas Pendentes', provasPendentes.toString()],
          ['Provas Aprovadas', provasAprovadas.toString()],
          ['Provas Reprovadas', provasReprovadas.toString()],
          ['Taxa de Aprovação', `${taxaAprovacao}%`],
          ['Taxa de Reprovação', `${taxaReprovacao}%`],
        ]

        autoTable(doc, {
          startY: yPosition,
          head: [tableDataEstatisticas[0]],
          body: tableDataEstatisticas.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15

        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(16)
        doc.text('Provas Geradas', 14, yPosition)
        yPosition += 10

        const tableDataProvas = provas.map(prova => {
          const totalCorretas = Object.values(prova.avaliacoes || {}).filter(a => a === 'correto').length
          const status = prova.finalizada
            ? totalCorretas >= prova.pontuacaoMinima
              ? 'Aprovado'
              : 'Reprovado'
            : 'Pendente'
          return [
            prova.nomeConscrito,
            prova.nomeInstrutor,
            prova.dataCriacao,
            prova.questoes.length.toString(),
            status,
            prova.finalizada ? totalCorretas.toString() : '-',
          ]
        })

        autoTable(doc, {
          startY: yPosition,
          head: [['Conscrito', 'Instrutor', 'Data', 'Questões', 'Status', 'Acertos']],
          body: tableDataProvas,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        })
      }

      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      doc.save(`relatorio-${abaAtiva.toLowerCase()}-${dataAtual.replace(/\//g, '-')}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF simples:', error)
      setErroDownload(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setTimeout(() => setErroDownload(null), 5000)
    }
  }

  // Função para gerar PDF detalhado (todas as abas)
  const gerarPDFDetalhado = async () => {
    try {
      setErroDownload(null)
      
      if (typeof window === 'undefined') {
        throw new Error('Função disponível apenas no navegador')
      }

      // Importação dinâmica - versão 5.x usa autoTable como função separada
      const jsPDFModule = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')
      
      const jsPDF = jsPDFModule.default
      // Na versão 5.x, autoTable é exportado como default
      const autoTable = (autoTableModule as any).default
      
      const doc = new jsPDF()
      
      // Verificar se autoTable está disponível
      if (typeof autoTable !== 'function') {
        console.error('autoTableModule keys:', Object.keys(autoTableModule))
        console.error('autoTableModule:', autoTableModule)
        throw new Error('jspdf-autotable não foi carregado. Tipo recebido: ' + typeof autoTable)
      }
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 20

      // Cabeçalho
      doc.setFontSize(20)
      doc.setTextColor(34, 197, 94) // Verde
      doc.text('Relatório Detalhado', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      doc.setFontSize(12)
      doc.setTextColor(107, 114, 128) // Cinza
      const dataAtual = new Date().toLocaleDateString('pt-BR')
      doc.text(`Data: ${dataAtual}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // Aba Militares
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('1. Militares', 14, yPosition)
      yPosition += 10

      const tableDataMilitares = [
        ['Status', 'Quantidade', 'Percentual'],
        ['Ativo', militaresAtivos.toString(), `${percentualAtivos}%`],
        ['Suspenso', militaresSuspensos.toString(), `${percentualSuspensos}%`],
        ['Exonerado', militaresExonerados.toString(), `${percentualExonerados}%`],
        ['Total', totalMilitares.toString(), '100%'],
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [tableDataMilitares[0]],
        body: tableDataMilitares.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Aba Cargos
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.text('2. Cargos', 14, yPosition)
      yPosition += 10

      const tableDataCargos = militaresPorCargo.map(item => [
        item.cargo.nome,
        item.cargo.nivel.toString(),
        item.quantidade.toString(),
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Cargo', 'Nível Hierárquico', 'Militares Ativos']],
        body: tableDataCargos,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Aba Desempenho
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.text('3. Desempenho', 14, yPosition)
      yPosition += 10

      const tableDataDesempenho = top10Desempenho.map((item, index) => [
        (index + 1).toString(),
        item.militar.nomeCompleto,
        item.militar.cargoNome || 'N/A',
        item.eventosPositivos.toString(),
        item.eventosNegativos.toString(),
        item.totalAcoes.toString(),
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Rank', 'Nome', 'Cargo', 'Eventos Positivos', 'Eventos Negativos', 'Total Ações']],
        body: tableDataDesempenho,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Aba Ações
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.text('4. Ações', 14, yPosition)
      yPosition += 10

      const tableDataAcoes = top10Acoes.map((item, index) => [
        (index + 1).toString(),
        item.militar.nomeCompleto,
        item.militar.cargoNome || 'N/A',
        item.prisoes.toString(),
        item.cursos.toString(),
        item.totalAcoes.toString(),
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Rank', 'Nome', 'Cargo', 'Prisões', 'Cursos', 'Total Ações']],
        body: tableDataAcoes,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Aba Infrações
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.text('5. Infrações', 14, yPosition)
      yPosition += 10

      const tableDataInfracoes = infracoes.map(item => [
        item.nome,
        item.gravidade,
        item.descricao.length > 50 ? item.descricao.substring(0, 50) + '...' : item.descricao,
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Nome', 'Gravidade', 'Descrição']],
        body: tableDataInfracoes,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: { 2: { cellWidth: 100 } },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Aba Punições
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.text('6. Punições', 14, yPosition)
      yPosition += 10

      const tableDataPunicoes = punicoes.map(item => [
        item.nome,
        item.pontos.toString() + ' pts',
        item.descricao.length > 50 ? item.descricao.substring(0, 50) + '...' : item.descricao,
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Nome', 'Pontos', 'Descrição']],
        body: tableDataPunicoes,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: { 2: { cellWidth: 100 } },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Aba Recrutamento
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.text('7. Recrutamento', 14, yPosition)
      yPosition += 10

      const tableDataRecrutamentoEstatisticas = [
        ['Métrica', 'Quantidade'],
        ['Total de Provas', totalProvas.toString()],
        ['Provas Finalizadas', provasFinalizadas.toString()],
        ['Provas Pendentes', provasPendentes.toString()],
        ['Provas Aprovadas', provasAprovadas.toString()],
        ['Provas Reprovadas', provasReprovadas.toString()],
        ['Taxa de Aprovação', `${taxaAprovacao}%`],
        ['Taxa de Reprovação', `${taxaReprovacao}%`],
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [tableDataRecrutamentoEstatisticas[0]],
        body: tableDataRecrutamentoEstatisticas.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.text('Provas Geradas', 14, yPosition)
      yPosition += 10

      const tableDataRecrutamentoProvas = provas.map(prova => {
        const totalCorretas = Object.values(prova.avaliacoes || {}).filter(a => a === 'correto').length
        const status = prova.finalizada
          ? totalCorretas >= prova.pontuacaoMinima
            ? 'Aprovado'
            : 'Reprovado'
          : 'Pendente'
        return [
          prova.nomeConscrito,
          prova.nomeInstrutor,
          prova.dataCriacao,
          prova.questoes.length.toString(),
          status,
          prova.finalizada ? totalCorretas.toString() : '-',
        ]
      })

      autoTable(doc, {
        startY: yPosition,
        head: [['Conscrito', 'Instrutor', 'Data', 'Questões', 'Status', 'Acertos']],
        body: tableDataRecrutamentoProvas,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      })

      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      doc.save(`relatorio-detalhado-${dataAtual.replace(/\//g, '-')}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF detalhado:', error)
      setErroDownload(`Erro ao gerar relatório detalhado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setTimeout(() => setErroDownload(null), 5000)
    }
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Mensagem de Erro */}
      {erroDownload && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{erroDownload}</span>
          </div>
          <button
            onClick={() => setErroDownload(null)}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Análises e estatísticas da organização</p>
        </div>
        {podeBaixar && (
          <button
            onClick={() => setIsModalDownloadOpen(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar Relatório
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto custom-scrollbar-horizontal pb-2" aria-label="Tabs">
          {abas.map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-t-lg transition-colors flex-shrink-0 whitespace-nowrap ${
                abaAtiva === aba
                  ? 'bg-white text-gray-900 border-b-2 border-green-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {aba}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {abaAtiva === 'Militares' && (
        <div className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Militares Ativos */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Militares Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {militaresAtivos} ({percentualAtivos}%)
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Suspensos */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Suspensos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {militaresSuspensos} ({percentualSuspensos}%)
                  </p>
                </div>
                <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Exonerados */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Exonerados</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {militaresExonerados} ({percentualExonerados}%)
                  </p>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Distribuição por Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Distribuição por Status</h2>
            <div className="space-y-4">
              {/* Ativo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Ativo</span>
                  <span className="text-sm text-gray-600">{militaresAtivos} militares</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentualAtivos}%` }}
                  />
                </div>
              </div>

              {/* Suspenso */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Suspenso</span>
                  <span className="text-sm text-gray-600">{militaresSuspensos} militares</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentualSuspensos}%` }}
                  />
                </div>
              </div>

              {/* Exonerado */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Exonerado</span>
                  <span className="text-sm text-gray-600">{militaresExonerados} militares</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentualExonerados}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aba Cargos */}
      {abaAtiva === 'Cargos' && (
        <div className="space-y-6">
          {/* Filtro */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <div className="relative">
                <select
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10 bg-white"
                >
                  <option value="Todos">Todos os Cargos</option>
                  {cargos.map((cargo) => (
                    <option key={cargo.id} value={cargo.id}>
                      {cargo.nome}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Militares Ativos por Cargo</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível Hierárquico</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Militares Ativos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {militaresPorCargo.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        Nenhum cargo cadastrado
                      </td>
                    </tr>
                  ) : (
                    militaresPorCargo.map((item) => (
                      <tr key={item.cargo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded" style={{ backgroundColor: item.cargo.cor }} />
                            <span className="text-sm font-medium text-gray-900">{item.cargo.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.cargo.nivel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantidade}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aba Desempenho */}
      {abaAtiva === 'Desempenho' && (
        <div className="space-y-6">
          {/* Filtro de Ordenação */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <div className="relative">
                <select
                  value={ordenacaoDesempenho}
                  onChange={(e) => setOrdenacaoDesempenho(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10 bg-white"
                >
                  <option value="Mais Positivos">Mais Positivos</option>
                  <option value="Mais Negativos">Mais Negativos</option>
                  <option value="Mais Ações">Mais Ações</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top 10 - Desempenho</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eventos Positivos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eventos Negativos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {top10Desempenho.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhum dado disponível
                      </td>
                    </tr>
                  ) : (
                    top10Desempenho.map((item, index) => (
                      <tr key={item.militar.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded text-xs font-bold text-white bg-gray-900">
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.militar.nomeCompleto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.militar.cargoNome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {item.eventosPositivos}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.eventosNegativos}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.totalAcoes}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aba Ações */}
      {abaAtiva === 'Ações' && (
        <div className="space-y-6">
          {/* Tabela */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top 10 - Ações Operacionais</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prisões</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cursos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {top10Acoes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhum dado disponível
                      </td>
                    </tr>
                  ) : (
                    top10Acoes.map((item, index) => (
                      <tr key={item.militar.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded text-xs font-bold text-white bg-gray-900">
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.militar.nomeCompleto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.militar.cargoNome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.prisoes}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.cursos}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.totalAcoes}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aba Infrações */}
      {abaAtiva === 'Infrações' && (
        <div className="space-y-6">
          {/* Filtro */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <div className="relative">
                <select
                  value={filtroInfracao}
                  onChange={(e) => setFiltroInfracao(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10 bg-white"
                >
                  <option value="Todas">Todas as Infrações</option>
                  <option value="Leve">Leve</option>
                  <option value="Média">Média</option>
                  <option value="Grave">Grave</option>
                  <option value="Gravíssima">Gravíssima</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Infrações Cadastradas</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gravidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {infracoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        Nenhuma infração cadastrada
                      </td>
                    </tr>
                  ) : (
                    infracoesFiltradas.map((infracao) => (
                      <tr key={infracao.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {infracao.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getGravidadeColor(infracao.gravidade)}`}>
                            {infracao.gravidade.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="truncate" title={infracao.descricao}>
                            {infracao.descricao}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aba Punições */}
      {abaAtiva === 'Punições' && (
        <div className="space-y-6">
          {/* Filtro */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <div className="relative">
                <select
                  value={filtroPunicao}
                  onChange={(e) => setFiltroPunicao(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10 bg-white"
                >
                  <option value="Todas">Todas as Punições</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Punições Cadastradas</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pontos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {punicoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        Nenhuma punição cadastrada
                      </td>
                    </tr>
                  ) : (
                    punicoesFiltradas.map((punicao) => (
                      <tr key={punicao.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {punicao.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {punicao.pontos} pts
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="truncate" title={punicao.descricao}>
                            {punicao.descricao}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aba Recrutamento */}
      {abaAtiva === 'Recrutamento' && (
        <div className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Provas</p>
                  <p className="text-3xl font-bold text-gray-900">{totalProvas}</p>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Finalizadas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Finalizadas</p>
                  <p className="text-3xl font-bold text-gray-900">{provasFinalizadas}</p>
                </div>
                <div className="w-16 h-16 bg-gray-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Aprovadas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Aprovadas</p>
                  <p className="text-3xl font-bold text-green-600">{provasAprovadas}</p>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Reprovadas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reprovadas</p>
                  <p className="text-3xl font-bold text-red-600">{provasReprovadas}</p>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Adicionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Pendentes */}
            <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-700">{provasPendentes}</p>
                </div>
                <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Taxa de Aprovação */}
            <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">Taxa de Aprovação</p>
                  <p className="text-3xl font-bold text-green-700">{taxaAprovacao}%</p>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Taxa de Reprovação */}
            <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Taxa de Reprovação</p>
                  <p className="text-3xl font-bold text-red-700">{taxaReprovacao}%</p>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Provas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Provas Geradas</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conscrito</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrutor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questões</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acertos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {provas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhuma prova gerada ainda
                      </td>
                    </tr>
                  ) : (
                    provas.map((prova) => {
                      const totalCorretas = Object.values(prova.avaliacoes || {}).filter(a => a === 'correto').length
                      const status = prova.finalizada
                        ? totalCorretas >= prova.pontuacaoMinima
                          ? 'Aprovado'
                          : 'Reprovado'
                        : 'Pendente'
                      const statusColor = status === 'Aprovado' 
                        ? 'bg-green-100 text-green-800' 
                        : status === 'Reprovado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      
                      return (
                        <tr key={prova.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {prova.nomeConscrito}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prova.nomeInstrutor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prova.dataCriacao}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prova.questoes.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prova.finalizada ? `${totalCorretas}/${prova.questoes.length}` : '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Download */}
      <ModalDownloadRelatorio
        isOpen={isModalDownloadOpen}
        onClose={() => setIsModalDownloadOpen(false)}
        onDownloadSimples={gerarPDFSimples}
        onDownloadDetalhado={gerarPDFDetalhado}
      />
    </div>
  )
}
