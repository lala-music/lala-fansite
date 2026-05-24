const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/admin.js', 'utf8');

const targetFunctionStart = '    function loadTicketReservations() {';
const targetFunctionEnd = '    function loadBarReservations() {';

const startIndex = code.indexOf(targetFunctionStart);
const endIndex = code.indexOf(targetFunctionEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const newFunc = `    function loadTicketReservations() {
        const reservations = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
        if (totalCountSpan) totalCountSpan.textContent = parseInt(reservations.length, 10);

        if (reservations.length === 0 && ticketAccordionContainer) {
            ticketAccordionContainer.innerHTML = '<div class="no-data">現在、チケットの予約はありません。</div>';
            return;
        }

        const grouped = {};
        reservations.forEach(res => {
            const key = res.target || res.liveTitle || '不明なライブ';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(res);
        });

        if (ticketAccordionContainer) {
            ticketAccordionContainer.innerHTML = '';
            const keys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
            keys.forEach(key => {
                const list = grouped[key];
                const totalCount = list.reduce((sum, r) => sum + (parseInt(r.count, 10) || 0), 0);
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'accordion-item fade-in-up';
                
                const header = document.createElement('div');
                header.className = 'accordion-header';
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                
                const titleSpan = document.createElement('span');
                titleSpan.innerHTML = key + ' <span style="font-size:0.8rem; font-weight:normal;">(' + list.length + '件 / ' + totalCount + '名)</span>';
                titleSpan.style.flexGrow = '1';
                
                const printBtn = document.createElement('button');
                printBtn.className = 'btn outline-btn print-btn';
                printBtn.textContent = '🖨️ 印刷';
                printBtn.style.padding = '5px 10px';
                printBtn.style.fontSize = '0.8rem';
                printBtn.style.marginRight = '15px';
                printBtn.style.zIndex = '10';
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'accordion-icon';
                iconSpan.textContent = '▼';
                
                header.appendChild(titleSpan);
                header.appendChild(printBtn);
                header.appendChild(iconSpan);
                
                const content = document.createElement('div');
                content.className = 'accordion-content';
                
                let tableHTML = \`
                    <div class="table-responsive" style="margin-bottom:0;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>申込日時</th>
                                    <th>名前</th>
                                    <th>メアド</th>
                                    <th>人数</th>
                                    <th>決済</th>
                                    <th>メッセージ</th>
                                </tr>
                            </thead>
                            <tbody>
                \`;
                
                list.forEach(res => {
                    const safeMsg = res.message ? res.message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '-';
                    const dateStr = res.submittedAt || res.date || '-';
                    const isPaid = res.paid === true || res.paid === 'true' || res.paid === 'TRUE';
                    tableHTML += \`
                        <tr>
                            <td style="font-size: 0.8rem; color: var(--text-muted);">\${dateStr}</td>
                            <td>\${escapeHTML(res.name)}</td>
                            <td>\${escapeHTML(res.email)}</td>
                            <td>\${escapeHTML(res.count)}名</td>
                            <td style="text-align:center;">
                                <input type="checkbox" class="paid-checkbox" data-time="\${dateStr}" data-email="\${res.email}" \${isPaid ? 'checked' : ''} style="cursor: pointer; transform: scale(1.5);">
                            </td>
                            <td style="font-size: 0.85rem;">\${safeMsg}</td>
                        </tr>
                    \`;
                });
                
                tableHTML += \`
                            </tbody>
                        </table>
                    </div>
                \`;
                content.innerHTML = tableHTML;
                
                header.addEventListener('click', (e) => {
                    if (e.target.classList.contains('print-btn') || e.target.tagName === 'INPUT') return;
                    content.classList.toggle('active');
                    iconSpan.classList.toggle('open');
                });
                
                printBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    printEventReservations(key, list);
                });
                
                itemDiv.appendChild(header);
                itemDiv.appendChild(content);
                ticketAccordionContainer.appendChild(itemDiv);
            });
            
            // Event listeners for paid checkboxes
            document.querySelectorAll('.paid-checkbox').forEach(cb => {
                cb.addEventListener('change', async (e) => {
                    const isChecked = e.target.checked;
                    const time = e.target.getAttribute('data-time');
                    const email = e.target.getAttribute('data-email');
                    
                    try {
                        e.target.disabled = true;
                        const fd = new FormData();
                        fd.append('type', 'toggle_paid');
                        fd.append('password', adminToken);
                        fd.append('submittedAt', time);
                        fd.append('email', email);
                        fd.append('paid', isChecked);
                        
                        const res = await fetch(GLOBAL_GAS_URL, { method: 'POST', body: fd });
                        const data = await res.json();
                        if (data.result !== 'success') {
                            alert('決済状況の保存に失敗しました。');
                            e.target.checked = !isChecked;
                        } else {
                            const reservations = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
                            const targetRes = reservations.find(r => r.submittedAt === time && r.email === email);
                            if (targetRes) {
                                targetRes.paid = isChecked;
                                localStorage.setItem('lala_reservations', JSON.stringify(reservations));
                            }
                        }
                    } catch(err) {
                        alert('通信エラーが発生しました。');
                        e.target.checked = !isChecked;
                    } finally {
                        e.target.disabled = false;
                    }
                });
            });
        }
    }

    function printEventReservations(title, list) {
        let printWin = window.open('', '_blank');
        let html = \`
            <html>
            <head>
                <title>\${escapeHTML(title)} 予約リスト</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { font-size: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #999; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                    .center { text-align: center; }
                    .paid { color: green; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>\${escapeHTML(title)} 予約リスト</h1>
                <p>総予約件数: \${list.length}件 / 合計人数: \${list.reduce((s, r) => s + (parseInt(r.count, 10) || 0), 0)}名</p>
                <table>
                    <thead>
                        <tr>
                            <th>お名前</th>
                            <th>人数</th>
                            <th>決済</th>
                            <th>メッセージ</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${list.map(r => {
                            const isPaid = r.paid === true || r.paid === 'true' || r.paid === 'TRUE';
                            const paidText = isPaid ? '<span class="paid">済</span>' : '未';
                            return \`<tr>
                                <td>\${escapeHTML(r.name)}</td>
                                <td class="center">\${escapeHTML(r.count)}名</td>
                                <td class="center">\${paidText}</td>
                                <td>\${escapeHTML(r.message || '')}</td>
                            </tr>\`;
                        }).join('')}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        \`;
        printWin.document.write(html);
        printWin.document.close();
    }

    // =====================================
    // 2. BARの予約データの表示
    // =====================================
`;
    const newCode = code.substring(0, startIndex) + newFunc + code.substring(endIndex + 36);
    fs.writeFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/admin.js', newCode);
}
