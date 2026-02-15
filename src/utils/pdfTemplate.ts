import {
  CurrencyCode,
  DeliveryMode,
  RentalStatus,
} from '../types/domain';
import { toCurrency, todayBrDate } from './format';

type RentalPdfItem = {
  equipmentName: string;
  quantity: number;
  unitPrice: number;
  equipmentValue: number;
  lineTotal: number;
};

export type RentalPdfTemplateData = {
  companyName: string;
  companyDocument: string;
  companyLogoUri: string;
  clientName: string;
  clientDocument: string;
  clientPhone: string;
  generatedAt: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: RentalStatus;
  quoteValidUntil: string;
  deliveryMode: DeliveryMode;
  deliveryAddress: string;
  freightValue: number;
  notes: string;
  currency: CurrencyCode;
  items: RentalPdfItem[];
  subtotal: number;
  total: number;
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const sanitizeFileNamePart = (value: string): string => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'cliente';
};

const buildDocumentType = (status: RentalStatus): string => {
  return status === 'quote' ? 'ORCAMENTO' : 'LOCACAO';
};

const buildQuoteAlert = (status: RentalStatus): string => {
  if (status !== 'quote') {
    return '';
  }

  return `
    <div class="highlight">
      <strong>ATENCAO:</strong> ESTE DOCUMENTO E UM ORCAMENTO E NAO REPRESENTA RESERVA DE EQUIPAMENTO.
    </div>
  `;
};

const buildItemsRows = (items: RentalPdfItem[], currency: CurrencyCode): string => {
  if (items.length === 0) {
    return `
      <tr>
        <td colspan="5" class="center muted">Nenhum equipamento selecionado.</td>
      </tr>
    `;
  }

  return items
    .map(item => {
      return `
        <tr>
          <td>${escapeHtml(item.equipmentName)}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">${toCurrency(item.unitPrice, currency)}</td>
          <td class="right">${toCurrency(item.equipmentValue, currency)}</td>
          <td class="right">${toCurrency(item.lineTotal, currency)}</td>
        </tr>
      `;
    })
    .join('');
};

const buildDeliveryLine = (mode: DeliveryMode): string => {
  return mode === 'delivery' ? 'Entrega' : 'Retirada';
};

export const buildRentalPdfFileName = (
  clientName: string,
  status: RentalStatus,
): string => {
  const prefix = status === 'quote' ? 'orcamento' : 'locacao';
  const dateToken = todayBrDate().replace(/\//g, '-');
  const clientToken = sanitizeFileNamePart(clientName);

  return `${prefix}_${clientToken}_${dateToken}`;
};

export const buildRentalPdfHtml = (data: RentalPdfTemplateData): string => {
  const logoBlock = data.companyLogoUri.trim()
    ? `
      <div class="logo-box">
        <img src="${escapeHtml(data.companyLogoUri.trim())}" alt="Logo empresa" />
      </div>
    `
    : '';

  const quoteValidity =
    data.status === 'quote' && data.quoteValidUntil.trim()
      ? escapeHtml(data.quoteValidUntil.trim())
      : '-';

  const notes = data.notes.trim() ? escapeHtml(data.notes.trim()) : '-';
  const address =
    data.deliveryMode === 'delivery' && data.deliveryAddress.trim()
      ? escapeHtml(data.deliveryAddress.trim())
      : '-';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Helvetica, Arial, sans-serif;
            color: #0D2A3A;
            margin: 0;
            padding: 24px;
            font-size: 12px;
          }
          .header {
            border: 1px solid #BFD8DF;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 12px;
          }
          .logo-box {
            margin-bottom: 8px;
          }
          .logo-box img {
            max-height: 70px;
            max-width: 160px;
            object-fit: contain;
          }
          .title {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
          }
          .subtitle {
            margin: 2px 0 10px;
            color: #4B6D79;
            font-size: 12px;
          }
          .line {
            margin: 2px 0;
          }
          .highlight {
            margin-top: 8px;
            padding: 8px;
            border-radius: 6px;
            background: #FFF4D6;
            border: 1px solid #F6D47A;
            color: #7A5A00;
          }
          .section {
            border: 1px solid #D6E6EA;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
          }
          .section-title {
            margin: 0 0 8px;
            font-size: 14px;
            font-weight: 800;
          }
          .grid {
            display: table;
            width: 100%;
          }
          .grid-row {
            display: table-row;
          }
          .grid-label, .grid-value {
            display: table-cell;
            padding: 2px 0;
            vertical-align: top;
          }
          .grid-label {
            width: 38%;
            color: #4B6D79;
            font-weight: 700;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
          }
          .table th {
            background: #EAF5F8;
            color: #0D2A3A;
            font-weight: 800;
            font-size: 11px;
            text-align: left;
            border: 1px solid #C7DDE4;
            padding: 6px;
          }
          .table td {
            border: 1px solid #D3E4E9;
            padding: 6px;
            font-size: 11px;
          }
          .center {
            text-align: center;
          }
          .right {
            text-align: right;
          }
          .muted {
            color: #6A8A96;
          }
          .totals {
            margin-top: 10px;
          }
          .totals-line {
            display: table;
            width: 100%;
            margin: 3px 0;
          }
          .totals-label, .totals-value {
            display: table-cell;
            font-weight: 700;
          }
          .totals-label {
            text-align: right;
            color: #4B6D79;
            padding-right: 8px;
          }
          .totals-value {
            width: 160px;
            text-align: right;
            color: #0D2A3A;
          }
          .totals-line.total .totals-label,
          .totals-line.total .totals-value {
            font-size: 14px;
            color: #0D2A3A;
          }
          .footer {
            margin-top: 16px;
            color: #4B6D79;
            font-size: 11px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoBlock}
          <h1 class="title">LOCAProX</h1>
          <div class="subtitle">Sistema de Locacao Inteligente</div>
          <div class="line"><strong>Tipo de documento:</strong> ${buildDocumentType(data.status)}</div>
          <div class="line"><strong>Empresa:</strong> ${escapeHtml(data.companyName.trim() || '-')}</div>
          <div class="line"><strong>CNPJ/CPF:</strong> ${escapeHtml(data.companyDocument.trim() || '-')}</div>
          <div class="line"><strong>Data de emissao:</strong> ${escapeHtml(data.generatedAt)}</div>
          ${buildQuoteAlert(data.status)}
        </div>

        <div class="section">
          <h2 class="section-title">Dados do Cliente</h2>
          <div class="grid">
            <div class="grid-row">
              <div class="grid-label">Cliente</div>
              <div class="grid-value">${escapeHtml(data.clientName)}</div>
            </div>
            <div class="grid-row">
              <div class="grid-label">CPF/CNPJ</div>
              <div class="grid-value">${escapeHtml(data.clientDocument || '-')}</div>
            </div>
            <div class="grid-row">
              <div class="grid-label">Telefone</div>
              <div class="grid-value">${escapeHtml(data.clientPhone || '-')}</div>
            </div>
            <div class="grid-row">
              <div class="grid-label">Inicio</div>
              <div class="grid-value">${escapeHtml(`${data.startDate} ${data.startTime}`)}</div>
            </div>
            <div class="grid-row">
              <div class="grid-label">Fim</div>
              <div class="grid-value">${escapeHtml(`${data.endDate} ${data.endTime}`)}</div>
            </div>
            <div class="grid-row">
              <div class="grid-label">Entrega/Retirada</div>
              <div class="grid-value">${buildDeliveryLine(data.deliveryMode)}</div>
            </div>
            <div class="grid-row">
              <div class="grid-label">Endereco de entrega</div>
              <div class="grid-value">${address}</div>
            </div>
            <div class="grid-row">
              <div class="grid-label">Validade do orcamento</div>
              <div class="grid-value">${quoteValidity}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Itens da Locacao</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="center">Qtd</th>
                <th class="right">Valor/Diaria ou Modalidade</th>
                <th class="right">Valor Patrimonio</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${buildItemsRows(data.items, data.currency)}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-line">
              <div class="totals-label">Subtotal</div>
              <div class="totals-value">${toCurrency(data.subtotal, data.currency)}</div>
            </div>
            <div class="totals-line">
              <div class="totals-label">Frete</div>
              <div class="totals-value">${toCurrency(data.freightValue, data.currency)}</div>
            </div>
            <div class="totals-line total">
              <div class="totals-label">Total Geral</div>
              <div class="totals-value">${toCurrency(data.total, data.currency)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Observacoes</h2>
          <div class="line">${notes}</div>
          <div class="line muted">
            A reserva dos equipamentos ocorre somente apos confirmacao operacional e pagamento combinado.
          </div>
        </div>

        <div class="footer">
          Gerado automaticamente pelo LocaProX.
        </div>
      </body>
    </html>
  `;
};
