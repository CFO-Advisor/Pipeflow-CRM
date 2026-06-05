import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Proposal } from '@/types'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 32,
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 4,
  },
  text: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    padding: '6 8',
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e2e8f0',
    padding: '6 8',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e2e8f0',
    padding: '6 8',
    backgroundColor: '#f8fafc',
  },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: '8 8',
    marginTop: 4,
  },
  totalLabel: {
    flex: 5,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'right',
  },
  totalValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'right',
  },
  footer: {
    marginTop: 40,
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 12,
    color: '#94a3b8',
    fontSize: 8,
    textAlign: 'center',
  },
  signatureBox: {
    marginTop: 40,
    flexDirection: 'row',
    gap: 32,
  },
  signLine: {
    flex: 1,
    borderTop: '1pt solid #94a3b8',
    paddingTop: 6,
    color: '#64748b',
    fontSize: 9,
    textAlign: 'center',
  },
  meta: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: '#374151',
  },
})

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

interface ProposalPDFProps {
  proposal: Proposal & { items: NonNullable<Proposal['items']> }
  workspaceName?: string
}

export function ProposalPDF({ proposal, workspaceName }: ProposalPDFProps) {
  const items = proposal.items ?? []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{proposal.title}</Text>
          {workspaceName && <Text style={styles.subtitle}>{workspaceName}</Text>}
        </View>

        {/* Metadados */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Data de emissão</Text>
            <Text style={styles.metaValue}>{formatDate(proposal.created_at)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Válida até</Text>
            <Text style={styles.metaValue}>{formatDate(proposal.valid_until)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{proposal.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>

        {/* Descrição */}
        {proposal.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.text}>{proposal.description}</Text>
          </View>
        )}

        {/* Itens */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itens da Proposta</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.col1]}>Descrição</Text>
                <Text style={[styles.tableHeaderText, styles.col2]}>Qtd</Text>
                <Text style={[styles.tableHeaderText, styles.col3]}>Unit.</Text>
                <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
              </View>
              {items.map((item, idx) => (
                <View key={item.id} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.text, styles.col1]}>{item.description}</Text>
                  <Text style={[styles.text, styles.col2]}>{item.quantity}</Text>
                  <Text style={[styles.text, styles.col3]}>{formatCurrency(item.unit_price)}</Text>
                  <Text style={[styles.text, styles.col4]}>{formatCurrency(item.quantity * item.unit_price)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>{formatCurrency(proposal.total_value)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Observações */}
        {proposal.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.text}>{proposal.notes}</Text>
          </View>
        )}

        {/* Assinaturas */}
        <View style={styles.signatureBox}>
          <View style={styles.signLine}>
            <Text>Assinatura do Vendedor</Text>
            {proposal.signed_by_seller_at && (
              <Text style={{ marginTop: 2, color: '#16a34a' }}>
                Assinado em {formatDate(proposal.signed_by_seller_at)}
              </Text>
            )}
          </View>
          <View style={styles.signLine}>
            <Text>Assinatura do Cliente</Text>
            {proposal.signed_by_client_at && (
              <Text style={{ marginTop: 2, color: '#16a34a' }}>
                Assinado em {formatDate(proposal.signed_by_client_at)}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Proposta gerada pelo Sales Flow CRM · {new Date().toLocaleDateString('pt-BR')}
        </Text>
      </Page>
    </Document>
  )
}
