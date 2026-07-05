import { getTotalWeeks } from './date';
import { Session } from '../types';

export function downloadCSV(session: Session) {
  const daysEng = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const daysKor = ["월", "화", "수", "목", "금", "토", "일"];

  // Prepare CSV header
  let csvContent = "\uFEFF클래스 세션 이름,게스트 성함,제출 여부,선택 슬롯 수,상세 가능 시간대 목록\r\n";

  session.guests.forEach(g => {
    const selectedSlots: string[] = [];
    Object.keys(g.schedule).forEach(key => {
      if (g.schedule[key]) {
        // Parse key like W1-Mon-10:00
        const parts = key.split('-');
        if (parts.length === 3) {
          const week = parts[0].replace('W', '');
          const dayIdx = daysEng.indexOf(parts[1]);
          const day = dayIdx !== -1 ? daysKor[dayIdx] : parts[1];
          const time = parts[2];
          selectedSlots.push(`${getTotalWeeks(session.startDate, session.endDate) > 1 ? week + '주차 ' : ''}${day}요일 ${time}`);
        } else {
          selectedSlots.push(key);
        }
      }
    });

    csvContent += `"${session.title}","${g.name}","${g.submitted ? '제출 완료' : '미제출'}",${selectedSlots.length},"${selectedSlots.join(' | ')}"\r\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `scheduler_export_${session.title.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadXLSX(session: Session) {
  // Let's create an XML Spreadsheet 2003 format (valid XML that Excel opens natively as spreadsheet)
  const daysEng = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const daysKor = ["월", "화", "수", "목", "금", "토", "일"];

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Schedule Export">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">클래스 세션 이름</Data></Cell>
    <Cell><Data ss:Type="String">게스트 성함</Data></Cell>
    <Cell><Data ss:Type="String">제출 여부</Data></Cell>
    <Cell><Data ss:Type="String">선택 슬롯 수</Data></Cell>
    <Cell><Data ss:Type="String">상세 가능 시간대 목록</Data></Cell>
   </Row>`;

  session.guests.forEach(g => {
    const selectedSlots: string[] = [];
    Object.keys(g.schedule).forEach(key => {
      if (g.schedule[key]) {
        const parts = key.split('-');
        if (parts.length === 3) {
          const week = parts[0].replace('W', '');
          const dayIdx = daysEng.indexOf(parts[1]);
          const day = dayIdx !== -1 ? daysKor[dayIdx] : parts[1];
          const time = parts[2];
          selectedSlots.push(`${getTotalWeeks(session.startDate, session.endDate) > 1 ? week + '주차 ' : ''}${day}요일 ${time}`);
        } else {
          selectedSlots.push(key);
        }
      }
    });

    xml += `
   <Row>
    <Cell><Data ss:Type="String">${session.title}</Data></Cell>
    <Cell><Data ss:Type="String">${g.name}</Data></Cell>
    <Cell><Data ss:Type="String">${g.submitted ? '제출 완료' : '미제출'}</Data></Cell>
    <Cell><Data ss:Type="Number">${selectedSlots.length}</Data></Cell>
    <Cell><Data ss:Type="String">${selectedSlots.join(' | ')}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `scheduler_export_${session.title.replace(/\s+/g, '_')}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadPDF(session: Session, containerId: string, currentActiveWeek: number = 1, selectedAnalysisView: string = 'heatmap') {
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const jsPDFModule = await import('jspdf');
  const jsPDF = (jsPDFModule as any).jsPDF || (jsPDFModule as any).default?.jsPDF || (jsPDFModule as any).default || jsPDFModule;

  const totalWeeks = getTotalWeeks(session.startDate, session.endDate) || 1;
  const pdf = new jsPDF('portrait', 'px', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();

  const isSlotAvailable = (dateStr: string, timeStr: string) => {
    if (!session.startDate || !session.endDate) return true;
    const current = `${dateStr}T${timeStr}`;
    return current >= session.startDate && current < session.endDate;
  };

  for (let week = 1; week <= totalWeeks; week++) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = '1000px';
    wrapper.style.zIndex = '-9999';
    wrapper.style.background = '#ffffff';
    wrapper.style.padding = '40px';
    wrapper.style.fontFamily = '"Inter", sans-serif';
    
    const startDate = new Date(session.startDate);
    const startOffset = (week - 1) * 7;
    const activeDates = [];
    const daysEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + startOffset + i);
      activeDates.push({
        dateStr: d.toISOString().split('T')[0],
        dayNameEng: daysEng[d.getDay()],
        formatted: d.getMonth()+1 + '/' + d.getDate() + ' (' + ['일','월','화','수','목','금','토'][d.getDay()] + ')'
      });
    }

    let html = 
      '<h1 style="font-size: 28px; color: #111827; margin-bottom: 12px; text-align: center; font-weight: bold;">' + session.title + ' (' + week + '주차)</h1>' +
      '<p style="font-size: 14px; color: #6b7280; margin-bottom: 24px; text-align: center; font-weight: bold;">' +
        '오버랩 기간: ' + session.startDate + ' ~ ' + session.endDate + ' | ' + session.time_interval + '분 단위' +
      '</p>' +
      '<table style="width: 100%; border-collapse: collapse; table-layout: fixed;">' +
        '<thead>' +
          '<tr>' +
            '<th style="width: 80px; border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; font-size: 12px; color: #374151;">시간</th>' +
            activeDates.map(d => '<th style="border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; font-size: 12px; color: #374151;">' + d.formatted + '</th>').join('') +
          '</tr>' +
        '</thead>' +
        '<tbody>';

    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += session.time_interval || 30) {
        const time = String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
        html += '<tr><td style="border: 1px solid #e5e7eb; text-align: center; font-size: 12px; padding: 8px; background: #f9fafb; font-weight: bold; color: #6b7280; vertical-align: top;">' + time + '</td>';
        
        for (const dateInfo of activeDates) {
          const key = 'W' + week + '-' + dateInfo.dayNameEng + '-' + time;
          const matched = session.guests.filter(g => g.submitted && g.schedule[key]);
          const count = matched.length;
        const isAvailable = isSlotAvailable(dateInfo.dateStr, time);
        const confirmedArr = Array.isArray(session.confirmedSlot) ? session.confirmedSlot : (session.confirmedSlot ? [session.confirmedSlot] : []);
        const isConfirmed = session.status === '확정' && confirmedArr.includes(key);

        let bgColor = '#ffffff';
        let color = '#374151';
        let fontW = 'normal';
        let cellContent = '';

        if (!isAvailable) {
          bgColor = '#fef2f2';
          color = '#fca5a5';
          cellContent = '<span style="font-size: 10px; font-weight: bold;">불가</span>';
        } else if (isConfirmed) {
          bgColor = '#4f46e5';
          color = '#ffffff';
          fontW = 'bold';
          cellContent = '<div style="background: #4f46e5; color: #ffffff; font-size: 10px; border-radius: 4px; padding: 4px; margin-bottom: 2px; font-weight: bold; text-align: center;">확정됨</div>';
        } else if (selectedAnalysisView === 'individual' && count > 0) {
            cellContent = matched.map(m => '<div style="background: #e0e7ff; color: #4338ca; font-size: 10px; border-radius: 4px; padding: 2px; margin-bottom: 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: bold;">' + m.name + '</div>').join('');
          } else {
            if (count >= 3) { bgColor = '#10b981'; color = '#ffffff'; fontW = 'bold'; }
            else if (count === 2) { bgColor = '#6ee7b7'; color = '#064e3b'; }
            else if (count === 1) { bgColor = '#d1fae5'; color = '#065f46'; }
            cellContent = count > 0 ? count + '명' : '';
          }

          html += '<td style="border: 1px solid #e5e7eb; text-align: center; font-size: 12px; padding: 8px; background: ' + bgColor + '; color: ' + color + '; font-weight: ' + fontW + '; vertical-align: top;">' + cellContent + '</td>';
        }
        html += '</tr>';
      }
    }

    html += '</tbody></table>';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    await new Promise(r => setTimeout(r, 300));

    try {
      const canvas = await (html2canvas as any)(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      const ratio = canvas.width / canvas.height;
      const targetWidth = pdfWidth;
      const targetHeight = targetWidth / ratio;

      if (week > 1) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'PNG', 0, 0, targetWidth, targetHeight);
    } catch (err) {
      console.error("PDF generation failed:", err);
      throw err;
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  pdf.save('scheduler_export_' + session.title.replace(/\s+/g, '_') + '.pdf');
}

export async function downloadPNG(session: Session, containerId: string, currentActiveWeek: number = 1, selectedAnalysisView: string = 'heatmap') {
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default || html2canvasModule;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.width = '1000px';
  wrapper.style.zIndex = '-9999';
  wrapper.style.background = '#ffffff';
  wrapper.style.padding = '40px';
  wrapper.style.fontFamily = '"Inter", sans-serif';
  
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
      formatted: d.getMonth()+1 + '/' + d.getDate() + ' (' + ['일','월','화','수','목','금','토'][d.getDay()] + ')'
    });
  }

  const isSlotAvailable = (dateStr: string, timeStr: string) => {
    if (!session.startDate || !session.endDate) return true;
    const current = `${dateStr}T${timeStr}`;
    return current >= session.startDate && current < session.endDate;
  };

  let html = 
    '<h1 style="font-size: 28px; color: #111827; margin-bottom: 12px; text-align: center; font-weight: bold;">' + session.title + ' (' + currentActiveWeek + '주차)</h1>' +
    '<p style="font-size: 14px; color: #6b7280; margin-bottom: 24px; text-align: center; font-weight: bold;">' +
      '오버랩 기간: ' + session.startDate + ' ~ ' + session.endDate + ' | ' + session.time_interval + '분 단위' +
    '</p>' +
    '<table style="width: 100%; border-collapse: collapse; table-layout: fixed;">' +
      '<thead>' +
        '<tr>' +
          '<th style="width: 80px; border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; font-size: 12px; color: #374151;">시간</th>' +
          activeDates.map(d => '<th style="border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; font-size: 12px; color: #374151;">' + d.formatted + '</th>').join('') +
        '</tr>' +
      '</thead>' +
      '<tbody>';

  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += session.time_interval || 30) {
      const time = String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
      html += '<tr><td style="border: 1px solid #e5e7eb; text-align: center; font-size: 12px; padding: 8px; background: #f9fafb; font-weight: bold; color: #6b7280; vertical-align: top;">' + time + '</td>';
      
      for (const dateInfo of activeDates) {
        const key = 'W' + currentActiveWeek + '-' + dateInfo.dayNameEng + '-' + time;
        const matched = session.guests.filter(g => g.submitted && g.schedule[key]);
        const count = matched.length;
        const isAvailable = isSlotAvailable(dateInfo.dateStr, time);
        const confirmedArr = Array.isArray(session.confirmedSlot) ? session.confirmedSlot : (session.confirmedSlot ? [session.confirmedSlot] : []);
        const isConfirmed = session.status === '확정' && confirmedArr.includes(key);

        let bgColor = '#ffffff';
        let color = '#374151';
        let fontW = 'normal';
        let cellContent = '';

        if (!isAvailable) {
          bgColor = '#fef2f2';
          color = '#fca5a5';
          cellContent = '<span style="font-size: 10px; font-weight: bold;">불가</span>';
        } else if (isConfirmed) {
          bgColor = '#4f46e5';
          color = '#ffffff';
          fontW = 'bold';
          cellContent = '<div style="background: #4f46e5; color: #ffffff; font-size: 10px; border-radius: 4px; padding: 4px; margin-bottom: 2px; font-weight: bold; text-align: center;">확정됨</div>';
        } else if (selectedAnalysisView === 'individual' && count > 0) {
          cellContent = matched.map(m => '<div style="background: #e0e7ff; color: #4338ca; font-size: 10px; border-radius: 4px; padding: 2px; margin-bottom: 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: bold;">' + m.name + '</div>').join('');
        } else {
          if (count >= 3) { bgColor = '#10b981'; color = '#ffffff'; fontW = 'bold'; }
          else if (count === 2) { bgColor = '#6ee7b7'; color = '#064e3b'; }
          else if (count === 1) { bgColor = '#d1fae5'; color = '#065f46'; }
          cellContent = count > 0 ? count + '명' : '';
        }

        html += '<td style="border: 1px solid #e5e7eb; text-align: center; font-size: 12px; padding: 8px; background: ' + bgColor + '; color: ' + color + '; font-weight: ' + fontW + '; vertical-align: top;">' + cellContent + '</td>';
      }
      html += '</tr>';
    }
  }

  html += '</tbody></table>';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  await new Promise(r => setTimeout(r, 300));

  try {
    const canvas = await (html2canvas as any)(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.href = imgData;
    link.setAttribute('download', 'scheduler_export_' + session.title.replace(/\s+/g, '_') + '.png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("PNG generation failed:", err);
    throw err;
  } finally {
    document.body.removeChild(wrapper);
  }
}

