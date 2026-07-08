const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/dashboard_lala_7942.html', 'utf8');

// We will add the memberNo field.

const oldFormGroup = <div class="form-group">
                        <label>お名前 *</label>;

const newFormGroup = <div class="form-group">
                        <label>会員番号 (任意・自動生成)</label>
                        <input type="text" id="fcMemberNo" class="form-control" placeholder="例：000001">
                    </div>
                    <div class="form-group">
                        <label>お名前 *</label>;

code = code.replace(oldFormGroup, newFormGroup);

const oldScript =         function saveFcMember() {
            const name = document.getElementById('fcMemberName').value;
            const email = document.getElementById('fcMemberEmail').value;
            const address = document.getElementById('fcMemberAddress').value;
            const tier = document.getElementById('fcMemberTier').value;;

const newScript =         function saveFcMember() {
            const memberNo = document.getElementById('fcMemberNo').value;
            const name = document.getElementById('fcMemberName').value;
            const email = document.getElementById('fcMemberEmail').value;
            const address = document.getElementById('fcMemberAddress').value;
            const tier = document.getElementById('fcMemberTier').value;;

code = code.replace(oldScript, newScript);

const oldSaveItem =                     item.name = name;
                    item.email = email;
                    item.address = address;
                    item.tier = tier;
                }
                editingMemberId = null;
            } else {
                data.push({
                    id: Date.now(),
                    name: name,
                    email: email,
                    address: address,
                    tier: tier,
                    joinDate: new Date().toISOString().split('T')[0]
                });
            };

const newSaveItem =                     if (memberNo) item.memberNo = memberNo;
                    item.name = name;
                    item.email = email;
                    item.address = address;
                    item.tier = tier;
                }
                editingMemberId = null;
            } else {
                let newNo = memberNo;
                if (!newNo) {
                    newNo = String(data.length + 1).padStart(6, '0');
                }
                data.push({
                    id: Date.now(),
                    memberNo: newNo,
                    name: name,
                    email: email,
                    address: address,
                    tier: tier,
                    joinDate: new Date().toISOString().split('T')[0]
                });
            };

code = code.replace(oldSaveItem, newSaveItem);

const oldClear =             document.getElementById('fcMemberName').value = '';
            document.getElementById('fcMemberEmail').value = '';;

const newClear =             document.getElementById('fcMemberNo').value = '';
            document.getElementById('fcMemberName').value = '';
            document.getElementById('fcMemberEmail').value = '';;

code = code.replace(oldClear, newClear);

const oldEdit =             document.getElementById('fcMemberName').value = item.name || '';
            document.getElementById('fcMemberEmail').value = item.email || '';;

const newEdit =             document.getElementById('fcMemberNo').value = item.memberNo || '';
            document.getElementById('fcMemberName').value = item.name || '';
            document.getElementById('fcMemberEmail').value = item.email || '';;

code = code.replace(oldEdit, newEdit);

const oldCancel =         function cancelMemberEdit() {
            editingMemberId = null;
            document.getElementById('fcMemberName').value = '';
            document.getElementById('fcMemberEmail').value = '';;

const newCancel =         function cancelMemberEdit() {
            editingMemberId = null;
            document.getElementById('fcMemberNo').value = '';
            document.getElementById('fcMemberName').value = '';
            document.getElementById('fcMemberEmail').value = '';;

code = code.replace(oldCancel, newCancel);

const oldRender =                 const tierLabel = item.tier === 'premier' ? 'プレミア' : 'レギュラー';
                const memberNo = String(index + 1).padStart(6, '0');
                
                tr.innerHTML = \
                    <td style="padding: 10px;">\<br><span style="color:#888; font-size:0.8rem;">No. \</span></td>;

const newRender =                 const tierLabel = item.tier === 'premier' ? 'プレミア' : 'レギュラー';
                const displayMemberNo = item.memberNo ? item.memberNo : String(index + 1).padStart(6, '0');
                
                tr.innerHTML = \
                    <td style="padding: 10px;">\<br><span style="color:#888; font-size:0.8rem;">No. \</span></td>;

code = code.replace(oldRender, newRender);

fs.writeFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/dashboard_lala_7942.html', code);
