document.addEventListener('DOMContentLoaded',()=>{
  
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  if (!isLoggedIn) {
    window.location.href = 'login.html';
    return;
  }

  const data = [];

  let selectedDate = null; 
  let currentPage = 1;
  const pageSize = 5;
  let calendarMonth = new Date(); 

  const el = id=>document.getElementById(id);
  const tableBody = el('table-body');
  const noData = el('no-data');
  const pagination = el('pagination');
  const calendarEl = el('calendar');
  const selectedDateEl = el('selected-date');
  const monthLabel = el('month-label');

  const inName = el('filter-name');
  const inSurname = el('filter-surname');
  const inFin = el('filter-fin');
  const inFrom = el('filter-from');
  const inTo = el('filter-to');
  const inRole = el('filter-role');

  const countStaff = el('count-staff');
  const countGuest = el('count-guest');

  el('btn-search').addEventListener('click',()=>{ currentPage=1; render(); });
  el('btn-reset').addEventListener('click',()=>{ inName.value='';inSurname.value='';inFin.value='';inFrom.value='';inTo.value='';inRole.value=''; selectedDate=null; currentPage=1; render(); renderCalendar(); });
  el('btn-today').addEventListener('click',()=>{ selectedDate=new Date(); calendarMonth=new Date(); currentPage=1; render(); renderCalendar(); });
  el('cal-prev').addEventListener('click',()=>{ if(!selectedDate) selectedDate=new Date(); selectedDate.setDate(selectedDate.getDate()-1); calendarMonth=new Date(selectedDate); currentPage=1; render(); renderCalendar(); });
  el('cal-next').addEventListener('click',()=>{ if(!selectedDate) selectedDate=new Date(); selectedDate.setDate(selectedDate.getDate()+1); calendarMonth=new Date(selectedDate); currentPage=1; render(); renderCalendar(); });
  el('month-prev').addEventListener('click',()=>{ calendarMonth.setMonth(calendarMonth.getMonth()-1); renderCalendar(); });
  el('month-next').addEventListener('click',()=>{ calendarMonth.setMonth(calendarMonth.getMonth()+1); renderCalendar(); });

  function formatDateTime(dt){
    const d = new Date(dt);
    return d.toLocaleString();
  }

  function sameDay(a,b){
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  function applyFilters(){
    let out = data.slice();
    const name = inName.value.trim().toLowerCase();
    const surname = inSurname.value.trim().toLowerCase();
    const fin = inFin.value.trim().toLowerCase();
    const role = inRole.value;
    const from = inFrom.value? new Date(inFrom.value+ 'T00:00'):null;
    const to = inTo.value? new Date(inTo.value+ 'T23:59'):null;

    if(name) out = out.filter(r=>r.name.toLowerCase().includes(name));
    if(surname) out = out.filter(r=>r.surname.toLowerCase().includes(surname));
    if(fin) out = out.filter(r=>r.fin.toLowerCase().includes(fin));
    if(role) out = out.filter(r=>r.role===role);
    if(from) out = out.filter(r=> new Date(r.datetime) >= from);
    if(to) out = out.filter(r=> new Date(r.datetime) <= to);
    if(selectedDate){
      out = out.filter(r=> sameDay(new Date(r.datetime), selectedDate));
    }
    return out;
  }

  function render(){
    const filtered = applyFilters();

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total/pageSize));
    if(currentPage>pages) currentPage = pages;
    const start = (currentPage-1)*pageSize;
    const pageItems = filtered.slice(start, start+pageSize);

    tableBody.innerHTML='';
    if(pageItems.length===0){
      noData.style.display='block';
    } else {
      noData.style.display='none';
      for(const r of pageItems){
        const row = document.createElement('div');
        row.className='row';
        row.innerHTML = `<div>${r.name} ${r.surname}</div><div>${r.fin}</div><div>${formatDateTime(r.datetime)}</div><div>${r.role}</div>`;
        tableBody.appendChild(row);
      }
    }

    pagination.innerHTML = '';
    if(pages>1){
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '‹';
      prevBtn.style.cssText = 'margin:0 4px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;background:#fff;cursor:pointer;';
      prevBtn.disabled = currentPage===1;
      prevBtn.onclick = ()=>{ if(currentPage>1){ currentPage--; render(); } };
      pagination.appendChild(prevBtn);

      const info = document.createElement('span');
      info.textContent = ` Səhifə ${currentPage} / ${pages} `;
      info.style.cssText = 'margin:0 6px;';
      pagination.appendChild(info);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = '›';
      nextBtn.style.cssText = 'margin:0 4px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;background:#fff;cursor:pointer;';
      nextBtn.disabled = currentPage===pages;
      nextBtn.onclick = ()=>{ if(currentPage<pages){ currentPage++; render(); } };
      pagination.appendChild(nextBtn);
    } else {
      pagination.innerHTML = `Səhifə 1 / 1`;
    }

    selectedDateEl.textContent = selectedDate? selectedDate.toLocaleDateString() : '—';
  }

  function renderCalendar(){
    calendarEl.innerHTML='';
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year,month,1).getDay();
    const daysInMonth = new Date(year,month+1,0).getDate();

    const blanks = firstDay;
    for(let i=0;i<blanks;i++){
      const el = document.createElement('div');
      calendarEl.appendChild(el);
    }

    for(let d=1; d<=daysInMonth; d++){
      const cell = document.createElement('div');
      cell.className='cal-day';
      const cellDate = new Date(year,month,d);
      cell.textContent = d;
      if(selectedDate && sameDay(cellDate, selectedDate)) cell.classList.add('selected');
      cell.addEventListener('click',()=>{ selectedDate = new Date(year,month,d); currentPage=1; render(); renderCalendar(); });
      calendarEl.appendChild(cell);
    }
  }

  selectedDate = new Date(); 
  calendarMonth = new Date(); 
  renderCalendar();
  render();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Çıxış etmək istədiyinizdən əminsiniz?')) {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        window.location.href = 'login.html';
      }
    });
  }
});
