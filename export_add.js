const fs = require('fs');
let code = fs.readFileSync('src/utils/export.ts', 'utf8');

code += `
export async function downloadPDF(session: Session, containerId: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const element = document.getElementById(containerId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    ignoreElements: (el) => el.classList.contains('pdf-no-export') || el.tagName === 'BUTTON'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(\`scheduler_export_\${session.title.replace(/\\s+/g, '_')}.pdf\`);
}

export async function downloadPNG(session: Session, containerId: string) {
  const html2canvas = (await import('html2canvas')).default;

  const element = document.getElementById(containerId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    ignoreElements: (el) => el.classList.contains('pdf-no-export') || el.tagName === 'BUTTON'
  });

  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imgData;
  link.setAttribute('download', \`scheduler_export_\${session.title.replace(/\\s+/g, '_')}.png\`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
`;
fs.writeFileSync('src/utils/export.ts', code);
