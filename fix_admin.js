const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/admin.js', 'utf8');

const oldCode1 =             if (data.reservations) {
                // スプレッドシート側の予約データをローカルにキャッシュ
                const tickets = data.reservations.filter(r => r.type === 'ticket');
                const barRes = data.reservations.filter(r => r.type === 'bar');
                localStorage.setItem('lala_reservations', JSON.stringify(tickets));
                localStorage.setItem('lala_bar_reservations', JSON.stringify(barRes));
            };

const newCode1 =             if (data.reservations) {
                const tickets = data.reservations.filter(r => r.type === 'ticket');
                const barRes = data.reservations.filter(r => r.type === 'bar');
                
                let localTickets = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
                let localBar = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
                
                tickets.forEach(rt => {
                   if (!localTickets.find(lt => lt.id == rt.id || (lt.name == rt.name && lt.submittedAt == rt.submittedAt))) {
                       localTickets.push(rt);
                   }
                });
                barRes.forEach(rb => {
                   if (!localBar.find(lb => lb.id == rb.id || (lb.name == rb.name && lb.createdAt == rb.createdAt))) {
                       localBar.push(rb);
                   }
                });
                
                localStorage.setItem('lala_reservations', JSON.stringify(localTickets));
                localStorage.setItem('lala_bar_reservations', JSON.stringify(localBar));
            };

const oldCode2 =                     if (data.reservations) {
                        const tickets = data.reservations.filter(r => r.type === 'ticket');
                        const barRes = data.reservations.filter(r => r.type === 'bar');
                        localStorage.setItem('lala_reservations', JSON.stringify(tickets));
                        localStorage.setItem('lala_bar_reservations', JSON.stringify(barRes));
                    };

const newCode2 =                     if (data.reservations) {
                        const tickets = data.reservations.filter(r => r.type === 'ticket');
                        const barRes = data.reservations.filter(r => r.type === 'bar');
                        let localTickets = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
                        let localBar = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
                        tickets.forEach(rt => {
                           if (!localTickets.find(lt => lt.id == rt.id || (lt.name == rt.name && lt.submittedAt == rt.submittedAt))) {
                               localTickets.push(rt);
                           }
                        });
                        barRes.forEach(rb => {
                           if (!localBar.find(lb => lb.id == rb.id || (lb.name == rb.name && lb.createdAt == rb.createdAt))) {
                               localBar.push(rb);
                           }
                        });
                        localStorage.setItem('lala_reservations', JSON.stringify(localTickets));
                        localStorage.setItem('lala_bar_reservations', JSON.stringify(localBar));
                    };

code = code.replace(oldCode1, newCode1);
code = code.replace(oldCode2, newCode2);
fs.writeFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/admin.js', code);
console.log('Done');
