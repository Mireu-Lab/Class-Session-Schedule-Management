import fs from 'fs';

let code = fs.readFileSync('src/utils/export.ts', 'utf-8');

const replacement = `export async function downloadPDF(session: Session, containerId: string, currentActiveWeek: number = 1) {
  const htmlToImage = await import('html-to-image');
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default || jsPDFModule;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '800px';
  wrapper.style.background = '#ffffff';
  wrapper.style.padding = '20px';
  wrapper.style.fontFamily = 'sans-serif';
  
  const startDate = new Date(session.startDate);
  const startOffset = (currentActiveWeek - 1) * 7;
  const activeDates = [];
  const daysEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + startOffset + i);
    activeDates.push({
      dateStr: d.toISOString().split('T')[0],
      dayNameEng: daysEng[d.getDay()],
      formatted: \`\${d.getMonth()+1}/\${d.getDate()} (\${['일','월','화','수','목','금','토'][d.getDay()]})\`
    });
  }

  let html = \`
    <h1 style="font-size: 24px; color: #111827; margin-bottom: 10px; text-align: center;">\${session.title} (\${currentActiveWeek}주차)</h1>
    <p style="font-size: 12px; color: #6b7280; margin-bottom: 20px; text-align: center;">
      오버랩 기간: \${session.startDate} ~ \${session.endDate} | \${session.time_interval}분 단위
    </p>
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
      <thead>
        <tr>
          <th style="width: 60px; border: 1px solid #e5e7eb; background: #f9fafb; padding: 8px; font-size: 10px;">시간</th>
          \${activeDates.map(d => \`<th style="border: 1px solid #e5e7eb; background: #f9fafb; padding: 8px; font-size: 10px;">\${d.formatted}</th>\`).join('')}
        </tr>
      </thead>
      <tbody>
  \`;

  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += session.time_interval || 30) {
      const time = \`\${String(hour).padStart(2, '0')}:\${String(min).padStart(2, '0')}\`;
      html += \`<tr><td style="border: 1px solid #e5e7eb; text-align: center; font-size: 10px; padding: 4px; background: #f9fafb; font-weight: bold; color: #6b7280;">\${time}</td>\`;
      
      for (const dateInfo of activeDates) {
        const key = \`W\${currentActiveWeek}-\${dateInfo.dayNameEng}-\${time}\`;
        const matched = session.guests.filter(g => g.submitted && g.schedule[key]);
        const count = matched.length;
        
        let bgColor = '#ffffff';
        let color = '#374151';
        let fontW = 'normal';
        if (count >= 3) { bgColor = '#10b981'; color = '#ffffff'; fontW = 'bold'; }
        else if (count === 2) { bgColor = '#6ee7b7'; color = '#064e3b'; }
        else if (count === 1) { bgColor = '#d1fae5'; color = '#065f46'; }

        html += \`<td style="border: 1px solid #e5e7eb; text-align: center; font-size: 10px; padding: 4px; background: \${bgColor}; color: \${color}; font-weight: \${fontW};">\${count > 0 ? count + '명' : ''}</td>\`;
      }
      html += \`</tr>\`;
    }
  }

  html += \`</tbody></table>\`;
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  await new Promise(r => setTimeout(r, 100));

  const imgData = await htmlToImage.toPng(wrapper, {
    pixelRatio: 2,
    backgroundColor: '#ffffff'
  });

  document.body.removeChild(wrapper);

  const pdf = new jsPDF('portrait', 'px', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  const imgProps = pdf.getImageProperties(imgData);
  const ratio = imgProps.width / imgProps.height;
  
  const targetWidth = pdfWidth;
  const targetHeight = targetWidth / ratio;

  pdf.addImage(imgData, 'PNG', 0, 0, targetWidth, targetHeight);
  pdf.save(\`scheduler_export_\${session.title.replace(/\\s+/g, '_')}.pdf\`);
}
`;

const startIndex = code.indexOf('export async function downloadPDF');
const nextFnIndex = code.indexOf('export async function downloadPNG');
const head = code.substring(0, startIndex);
const tail = code.substring(nextFnIndex);

fs.writeFileSync('src/utils/export.ts', head + replacement + "\n\n" + tail);

let detailSvelte = fs.readFileSync('src/components/Detail.svelte', 'utf-8');
detailSvelte = detailSvelte.replace(
  "downloadPDF(currentSession, 'detail-export-area')",
  "downloadPDF(currentSession, 'detail-export-area', currentActiveWeek)"
);
fs.writeFileSync('src/components/Detail.svelte', detailSvelte);

let appSvelte = fs.readFileSync('src/App.svelte', 'utf-8');
appSvelte = appSvelte.replace(
  "downloadPDF(currentSession, 'detail-export-area')",
  "downloadPDF(currentSession, 'detail-export-area', 1)" // fallback if called from App.svelte
);
fs.writeFileSync('src/App.svelte', appSvelte);

