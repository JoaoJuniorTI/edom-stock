// lib/pdf.ts
// Geração do PDF de orçamento — compartilhada entre a página de orçamento
// e a lista de orçamentos salvos.
//
// Item 1: em vez de baixar (pdf.save), o PDF é aberto em uma NOVA ABA.
// No Safari do iPhone, window.open só funciona se chamado dentro do "gesto"
// do clique — por isso a aba é aberta logo na 1ª linha, antes de qualquer
// await. Se o navegador bloquear o pop-up, cai no download como fallback.

export interface QuotePdfItem {
  product_name: string
  brand: string
  volume_ml: number
  price: number
}

export interface QuotePdfData {
  number: string
  client_name: string
  client_contact?: string | null
  items: QuotePdfItem[]
  frete_valor: number
  frete_transp?: string | null
  desconto_tipo: 'reais' | 'percent'
  desconto_valor: number
  note?: string | null
  created_at?: string | null
}

function fmt(v: number) {
  return 'R$\u00a0' + v.toFixed(2).replace('.', ',')
}

export async function generateQuotePDF(data: QuotePdfData) {
  // ⚠️ Abrir a aba AGORA (síncrono), ainda dentro do gesto do clique.
  // Abrir após um await faz o iOS tratar como pop-up e bloquear.
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null
  if (win) {
    win.document.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Gerando orçamento…</title></head>' +
      '<body style="margin:0;font-family:-apple-system,Arial,sans-serif;display:flex;' +
      'align-items:center;justify-content:center;height:100vh;color:#A8842C;' +
      'background:#FAF7F0;font-size:15px">Gerando orçamento…</body></html>'
    )
    win.document.close()
  }

  try {
    const date = new Date(data.created_at || Date.now())
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const subtotal    = data.items.reduce((s, i) => s + Number(i.price), 0)
    const frete       = Number(data.frete_valor) || 0
    const descontoRaw = Number(data.desconto_valor) || 0
    const desconto    = data.desconto_tipo === 'percent' ? subtotal * (descontoRaw / 100) : descontoRaw
    const total       = subtotal + frete - desconto

    const freteRow = frete > 0
      ? `<tr>
          <td colspan="3" style="padding:10px 12px;font-size:13px;color:#888;font-style:italic;border-top:1px solid #EDE0C8">Frete${data.frete_transp ? ` · ${data.frete_transp}` : ''}</td>
          <td style="padding:10px 12px;text-align:right;font-weight:600;font-size:13px;border-top:1px solid #EDE0C8">${fmt(frete)}</td>
         </tr>` : ''

    const descontoRow = desconto > 0
      ? `<tr>
          <td colspan="3" style="padding:10px 12px;font-size:13px;color:#2e7d32;font-style:italic;border-top:1px solid #EDE0C8">Desconto${data.desconto_tipo === 'percent' ? ` (${descontoRaw}%)` : ''}</td>
          <td style="padding:10px 12px;text-align:right;font-weight:600;font-size:13px;color:#2e7d32;border-top:1px solid #EDE0C8">- ${fmt(desconto)}</td>
         </tr>` : ''

    const itemRows = data.items.map(i => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;font-size:13px">${i.product_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;font-size:11.5px;color:#888">${i.brand}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;text-align:center;font-size:13px">${i.volume_ml}ml</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;text-align:right;font-weight:600;font-size:13px">${fmt(Number(i.price))}</td>
      </tr>`).join('')

    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;background:#fff;font-family:Arial,sans-serif'
    container.innerHTML = `
      <div style="padding:44px 48px;background:#fff;width:700px">

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:22px;border-bottom:1.5px solid #E8D5A3">
          <div>
            <div style="font-size:28px;font-weight:300;color:#A8842C;letter-spacing:3px;line-height:1;font-family:Georgia,serif">EDOM DECANTS</div>
            <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#C7C7CC;margin-top:5px;font-weight:500">Decants de Luxo</div>
          </div>
          <div style="text-align:right;font-size:12px;color:#6C6C70;line-height:1.9">
            <div><strong style="color:#3A3A3C">Orçamento</strong></div>
            <div>${data.number}</div>
            <div>${date}</div>
            <div style="font-size:10px;color:#B8943F;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:3px">Proposta Comercial</div>
          </div>
        </div>

        <div style="background:#FAF7F0;border:1px solid #EDE0C8;border-radius:10px;padding:16px 20px;margin-bottom:26px">
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C7C7CC;margin-bottom:5px">Orçamento para</div>
          <div style="font-size:18px;color:#1C1C1E;font-weight:400;font-family:Georgia,serif">${data.client_name}</div>
          ${data.client_contact ? `<div style="font-size:12px;color:#6C6C70;margin-top:2px">${data.client_contact}</div>` : ''}
        </div>

        <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#AEAEB2;margin-bottom:12px">Itens selecionados</div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#FAF7F0;border-bottom:1.5px solid #E8D5A3">
              <th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Perfume</th>
              <th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Marca</th>
              <th style="text-align:center;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Volume</th>
              <th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            ${freteRow}
            ${descontoRow}
          </tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:14px;margin-top:16px;padding-top:16px;border-top:2px solid #B8943F">
          <span style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#AEAEB2">Total</span>
          <span style="font-size:26px;color:#A8842C;font-weight:300;font-family:Georgia,serif">${fmt(total)}</span>
        </div>

        ${data.note ? `<div style="margin-top:22px;padding:12px 16px;background:#FAF7F0;border-left:3px solid #B8943F;font-size:12px;color:#6C6C70;line-height:1.6">${data.note}</div>` : ''}

        <div style="margin-top:40px;padding-top:16px;border-top:1px solid #F0EBE0;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:13px;color:#B8943F;letter-spacing:2px;font-family:Georgia,serif">EDOM DECANTS</div>
          <div style="font-size:10px;color:#C7C7CC;text-align:right;line-height:1.7">Orçamento válido por 7 dias<br/>Preços sujeitos à disponibilidade de estoque</div>
        </div>

      </div>
    `
    document.body.appendChild(container)

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    document.body.removeChild(container)

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW  = pageW
    const imgH  = (canvas.height * pageW) / canvas.width

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH)
    } else {
      let y = 0
      while (y < imgH) {
        pdf.addImage(imgData, 'JPEG', 0, -y, imgW, imgH)
        y += pageH
        if (y < imgH) pdf.addPage()
      }
    }

    const fileName = `orcamento-${data.client_name.toLowerCase().replace(/\s+/g, '-')}-${data.number}.pdf`

    // Abre em nova aba. Fallback para download se o pop-up foi bloqueado.
    const blobUrl = String(pdf.output('bloburl'))
    if (win) {
      win.location.href = blobUrl
    } else {
      pdf.save(fileName)
    }
  } catch (err) {
    if (win) win.close()
    throw err
  }
}
