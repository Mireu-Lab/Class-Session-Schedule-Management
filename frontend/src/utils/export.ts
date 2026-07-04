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
          selectedSlots.push(`${session.duration === '4weeks' ? week + '주차 ' : ''}${day}요일 ${time}`);
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
          selectedSlots.push(`${session.duration === '4weeks' ? week + '주차 ' : ''}${day}요일 ${time}`);
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
