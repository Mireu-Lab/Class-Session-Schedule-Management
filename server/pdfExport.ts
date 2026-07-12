import puppeteer from 'puppeteer';

// 백엔드 단에서 순수 HTML을 처음부터 그리는 함수
export function generateCalendarHTML(session: any, activeWeek: number): string {
  // 실제로는 session 데이터를 파싱하여 4주차 전체 또는 선택된 주차의 HTML을 생성합니다.
  let html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${session.title} - ${activeWeek}주차</title>
      <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #fff; }
        h1 { font-size: 24px; color: #111827; margin-bottom: 10px; }
        .info { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 10px; }
        th { background: #f9fafb; font-weight: bold; color: #374151; }
        .time-col { width: 60px; background: #f9fafb; font-weight: bold; }
        .cell-0 { background: #ffffff; }
        .cell-1 { background: #d1fae5; color: #065f46; }
        .cell-2 { background: #6ee7b7; color: #064e3b; }
        .cell-3 { background: #10b981; color: #ffffff; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>${session.title} (${activeWeek}주차)</h1>
      <div class="info">오버랩 기간: ${session.startDate} ~ ${session.endDate} | ${session.time_interval}분 단위</div>
      <table>
        <thead>
          <tr>
            <th class="time-col">시간</th>
            <!-- 동적으로 날짜 헤더 생성 (월~일) -->
            <th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th><th>일</th>
          </tr>
        </thead>
        <tbody>
  `;

  // 00:00 부터 24:00 까지 모든 시간대 렌더링
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += session.time_interval || 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      html += `<tr><td class="time-col">${time}</td>`;
      
      // 7일간의 데이터 (실제 데이터에 맞게 렌더링)
      for (let d = 0; d < 7; d++) {
        // 임시 더미 카운트 (실제로는 session.guests 데이터 기반 계산)
        const count: number = (session as any).dummyCount || 0; 
        const cellClass = count >= 3 ? 'cell-3' : count === 2 ? 'cell-2' : count === 1 ? 'cell-1' : 'cell-0';
        html += `<td class="${cellClass}">${count > 0 ? count + '명' : ''}</td>`;
      }
      html += `</tr>`;
    }
  }

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;
  return html;
}

// 백엔드 엔드포인트 핸들러 예시 (Express)
export async function exportPdfHandler(req: any, res: any) {
  try {
    const { session, activeWeek } = req.body;
    
    // 1. 처음부터 완전한 HTML 생성 (스크롤, 잘림 없음)
    const htmlContent = generateCalendarHTML(session, activeWeek);
    
    // 2. Puppeteer를 이용해 백엔드에서 브라우저 렌더링
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // 3. 생성된 HTML 주입
    await page.setContent(htmlContent, { waitUntil: 'load' });
    
    // 4. 세로(portrait) 모드로 전체 페이지 PDF 변환
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // CSS 배경색 유지
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    await browser.close();
    
    // 5. 클라이언트로 전송
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=calendar_export.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    res.status(500).send('PDF 생성 중 오류가 발생했습니다.');
  }
}
