// LURA Beauty — app.js
// كلمة السر الافتراضية: Lura@2026
// لتغييرها: عدّلي السطر: var correct = (pw === atob('...'))
// احسبي base64 لكلمتك الجديدة على: base64encode.org

var catLabels={serum:'سيروم',cream:'كريم',cleanser:'منظف',sunscreen:'واقي شمس',eye:'عيون',other:'أخرى'};
var catBadge={serum:'badge-serum',cream:'badge-cream',cleanser:'badge-cleanser',sunscreen:'badge-sunscreen',eye:'badge-eye',other:'badge-other'};
var catEn={serum:'Serums',cream:'Creams',cleanser:'Cleansers',sunscreen:'Sunscreens',eye:'Eye Care',other:'Other'};
var cart=[],currentCatFilter='all',editId=null;

// ── LOGIN ─────────────────────────────────────────────────
function showAdminLogin(){
  document.getElementById('admin-pw-input').value='';
  document.getElementById('pw-error').style.display='none';
  document.getElementById('admin-login-modal').classList.add('open');
  setTimeout(function(){document.getElementById('admin-pw-input').focus()},150);
}
function checkAdminPw(){
  var pw=document.getElementById('admin-pw-input').value;
  // كلمة السر: Lura@2026
  if(pw===atob('THVyYUAyMDI2')){
    document.getElementById('admin-login-modal').classList.remove('open');
    showPage('admin'); renderAdmin();
  } else {
    document.getElementById('pw-error').style.display='block';
    document.getElementById('admin-pw-input').value='';
    document.getElementById('admin-pw-input').focus();
  }
}

// ── PAGES ─────────────────────────────────────────────────
function showPage(p){
  document.querySelectorAll('.page').forEach(function(e){e.classList.remove('active')});
  document.getElementById('page-'+p).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(p==='admin') renderAdmin();
  if(p==='home') renderHome();
}
function toggleMobileNav(){document.getElementById('mobile-nav').classList.toggle('open')}

// ── HOME ──────────────────────────────────────────────────
function renderHome(){
  document.getElementById('hero-count').textContent=products.length;
  document.querySelectorAll('.cat-count').forEach(function(el){
    el.textContent=products.filter(function(p){return p.cat===el.getAttribute('data-cat')}).length+' منتج';
  });
  var top=[...products].sort(function(a,b){return b.price-a.price}).slice(0,8);
  document.getElementById('featured-grid').innerHTML=top.map(cardHTML).join('');
}
function filterAndGo(cat){
  currentCatFilter=cat;showPage('store');renderStore();
  setTimeout(function(){
    document.querySelectorAll('.filter-chip').forEach(function(b){b.classList.remove('active')});
    document.querySelectorAll('.filter-chip').forEach(function(b){if(b.textContent.trim()===catLabels[cat])b.classList.add('active')});
  },100);
}

// ── STORE ─────────────────────────────────────────────────
function setFilter(btn,cat){
  document.querySelectorAll('.filter-chip').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active'); currentCatFilter=cat; renderStore();
}
function renderStore(){
  var q=(document.getElementById('store-search').value||'').toLowerCase();
  var s=document.getElementById('sort-select').value;
  var list=products.filter(function(p){
    return (currentCatFilter==='all'||p.cat===currentCatFilter)&&
      (!q||p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||(p.nameAr&&p.nameAr.includes(q)));
  });
  if(s==='price-asc') list.sort(function(a,b){return a.price-b.price});
  else if(s==='price-desc') list.sort(function(a,b){return b.price-a.price});
  else if(s==='name') list.sort(function(a,b){return a.name.localeCompare(b.name)});
  document.getElementById('results-count').textContent='عرض '+list.length+' منتج'+(currentCatFilter!=='all'?' — '+catLabels[currentCatFilter]:'');
  document.getElementById('store-grid').innerHTML=list.length?list.map(cardHTML).join('')
    :'<div style="grid-column:1/-1;padding:5rem;text-align:center;color:var(--mid);font-family:Cormorant Garamond,serif;font-style:italic;font-size:22px;background:#fff">لا توجد منتجات</div>';
}
function cardHTML(p){
  return '<div class="product-card">'
    +'<span class="cat-badge '+catBadge[p.cat]+'">'+catLabels[p.cat]+'</span>'
    +'<div class="product-img-box">'+(p.img?'<img src="'+p.img+'" alt="'+p.name+'">':'<i class="fa fa-leaf placeholder-icon"></i>')+'</div>'
    +'<div class="product-brand">'+p.brand+'</div>'
    +'<div class="product-name-en">'+p.name+'</div>'
    +'<div class="product-name-ar">'+p.nameAr+'</div>'
    +'<div class="product-footer">'
    +'<div class="product-price">'+p.price.toLocaleString()+' <small>ر.ي</small></div>'
    +'<button class="add-btn" onclick="addToCart('+p.id+')" '+(p.qty===0?'disabled':'')+'>+ أضف</button>'
    +'</div></div>';
}

// ── CART ──────────────────────────────────────────────────
function addToCart(id){
  var p=products.find(function(x){return x.id===id});
  if(!p||p.qty===0)return;
  var ex=cart.find(function(x){return x.id===id});
  if(ex){if(ex.cq<p.qty)ex.cq++;else{showNotif('الكمية المتاحة محدودة','error');return;}}
  else{var it=Object.assign({},p);it.cq=1;cart.push(it);}
  updateCartUI();showNotif('✓ تمت الإضافة');
}
function removeFromCart(id){cart=cart.filter(function(x){return x.id!==id});updateCartUI();}
function changeQty(id,d){
  var it=cart.find(function(x){return x.id===id});
  var p=products.find(function(x){return x.id===id});
  if(!it)return;it.cq+=d;
  if(it.cq<=0)removeFromCart(id);
  else if(it.cq>p.qty){it.cq=p.qty;showNotif('الكمية المتاحة محدودة','error');}
  else updateCartUI();
}
function clearCart(){cart=[];updateCartUI();showNotif('تم تفريغ السلة');}
function updateCartUI(){
  document.getElementById('cart-count').textContent=cart.reduce(function(s,i){return s+i.cq},0);
  var total=cart.reduce(function(s,i){return s+i.price*i.cq},0);
  document.getElementById('cart-total').textContent=total.toLocaleString()+' ر.ي';
  var ci=document.getElementById('cart-items');
  if(!cart.length){ci.innerHTML='<div class="empty-cart"><div class="empty-icon"><i class="fa fa-shopping-bag"></i></div><div class="empty-txt">السلة فارغة</div></div>';return;}
  ci.innerHTML=cart.map(function(it){
    return '<div class="cart-item">'
      +'<div class="cart-item-img">'+(it.img?'<img src="'+it.img+'" alt="">':'<i class="fa fa-leaf" style="color:var(--rose)"></i>')+'</div>'
      +'<div class="cart-item-info"><div class="cart-item-brand">'+it.brand+'</div>'
      +'<div class="cart-item-name">'+it.name+'</div>'
      +'<div class="cart-item-foot"><div class="cart-item-price">'+(it.price*it.cq).toLocaleString()+' ر.ي</div>'
      +'<div class="qty-controls"><button class="qty-btn" onclick="changeQty('+it.id+',-1)">−</button>'
      +'<span class="qty-num">'+it.cq+'</span>'
      +'<button class="qty-btn" onclick="changeQty('+it.id+',1)">+</button>'
      +'<button class="rm-btn" onclick="removeFromCart('+it.id+')"><i class="fa fa-trash"></i></button>'
      +'</div></div></div></div>';
  }).join('');
}
function toggleCart(){
  document.getElementById('cart-sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function checkout(){
  if(!cart.length){showNotif('السلة فارغة','error');return;}
  var lines=cart.map(function(i){return '• '+i.brand+' — '+i.name+' × '+i.cq+' = '+(i.price*i.cq).toLocaleString()+' ر.ي'});
  var total=cart.reduce(function(s,i){return s+i.price*i.cq},0);
  window.open('https://wa.me/?text='+encodeURIComponent('طلب جديد — LURA Beauty Collection\n\n'+lines.join('\n')+'\n\nالإجمالي: '+total.toLocaleString()+' ر.ي'),'_blank');
}

// ── ADMIN ─────────────────────────────────────────────────
function renderAdmin(){
  var total=products.reduce(function(s,p){return s+p.price*p.qty},0);
  document.getElementById('admin-stats').innerHTML=
    stat(products.length,'إجمالي المنتجات')+
    stat(products.filter(function(p){return p.qty>0}).length,'متاح للبيع')+
    stat(total.toLocaleString(),'قيمة المخزون ر.ي')+
    stat(products.filter(function(p){return p.qty===0}).length,'نفدت الكمية');
  var q=(document.getElementById('admin-search').value||'').toLowerCase();
  var list=q?products.filter(function(p){return p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.nameAr.includes(q)}):products;
  document.getElementById('admin-tbody').innerHTML=list.map(function(p){
    var qc=p.qty===0?'color:var(--red);font-weight:600':p.qty<3?'color:orange;font-weight:600':'';
    return '<tr><td style="color:var(--mid);font-size:10px">'+p.id+'</td>'
      +'<td style="font-size:10px;letter-spacing:1.5px;color:var(--rose);text-transform:uppercase">'+p.brand+'</td>'
      +'<td><div style="font-size:12px;font-weight:500">'+p.name+'</div><div style="font-size:10px;color:var(--mid);margin-top:2px">'+p.nameAr+'</div></td>'
      +'<td><span class="cat-badge '+catBadge[p.cat]+'" style="position:static;display:inline-block">'+catLabels[p.cat]+'</span></td>'
      +'<td style="'+qc+'">'+p.qty+'</td>'
      +'<td style="font-family:Cormorant Garamond,serif;font-size:17px">'+p.price.toLocaleString()+' ر.ي</td>'
      +'<td><div class="action-btns"><button class="btn-edit" onclick="openModal('+p.id+')"><i class="fa fa-edit"></i> تعديل</button>'
      +'<button class="btn-delete" onclick="deleteProduct('+p.id+')"><i class="fa fa-trash"></i></button></div></td></tr>';
  }).join('');
}
function stat(n,l){return '<div class="admin-stat"><div class="admin-stat-num">'+n+'</div><div class="admin-stat-label">'+l+'</div></div>';}
function openModal(id){
  editId=id||null;
  document.getElementById('modal-title').textContent=id?'تعديل المنتج':'إضافة منتج جديد';
  if(id){
    var p=products.find(function(x){return x.id===id});
    document.getElementById('f-brand').value=p.brand;
    document.getElementById('f-name').value=p.name;
    document.getElementById('f-name-ar').value=p.nameAr;
    document.getElementById('f-price').value=p.price;
    document.getElementById('f-qty').value=p.qty;
    document.getElementById('f-cat').value=p.cat;
    document.getElementById('f-barcode').value=p.barcode||'';
    document.getElementById('f-desc').value=p.desc||'';
    var pr=document.getElementById('img-preview-modal');
    if(p.img){pr.src=p.img;pr.style.display='block';}else pr.style.display='none';
  } else {
    ['f-brand','f-name','f-name-ar','f-price','f-qty','f-barcode','f-desc'].forEach(function(x){document.getElementById(x).value=''});
    document.getElementById('f-cat').value='serum';
    document.getElementById('img-preview-modal').style.display='none';
  }
  document.getElementById('product-modal').classList.add('open');
}
function closeModal(){document.getElementById('product-modal').classList.remove('open');}
function saveProduct(){
  var brand=document.getElementById('f-brand').value.trim();
  var name=document.getElementById('f-name').value.trim();
  var nameAr=document.getElementById('f-name-ar').value.trim();
  var price=parseFloat(document.getElementById('f-price').value);
  var qty=parseInt(document.getElementById('f-qty').value);
  var cat=document.getElementById('f-cat').value;
  var barcode=document.getElementById('f-barcode').value.trim();
  var desc=document.getElementById('f-desc').value.trim();
  var imgEl=document.getElementById('img-preview-modal');
  var img=(imgEl&&imgEl.style.display!=='none'&&imgEl.src.length>10)?imgEl.src:'';
  if(!brand||!name||!nameAr||isNaN(price)||isNaN(qty)){showNotif('يرجى ملء الحقول المطلوبة','error');return;}
  if(editId){Object.assign(products.find(function(x){return x.id===editId}),{brand,name,nameAr,price,qty,cat,barcode,desc,img});showNotif('✓ تم التحديث');}
  else{products.push({id:nextId++,brand,name,nameAr,price,qty,cat,barcode,desc,img});showNotif('✓ تمت الإضافة');}
  closeModal();renderAdmin();renderStore();renderHome();
}
function deleteProduct(id){
  if(!confirm('هل أنت متأكدة من حذف هذا المنتج؟'))return;
  products=products.filter(function(p){return p.id!==id});
  cart=cart.filter(function(c){return c.id!==id});
  updateCartUI();renderAdmin();renderStore();
  showNotif('تم حذف المنتج');
}
function previewImg(input){
  var file=input.files[0];if(!file)return;
  var r=new FileReader();
  r.onload=function(e){
    var img=document.getElementById('img-preview-modal');
    img.src=e.target.result;img.style.display='block';
    document.getElementById('upload-placeholder').style.display='none';
  };r.readAsDataURL(file);
}

// ── EXPORT: FACEBOOK SHOP ─────────────────────────────────
// متجر فيسبوك يقبل ملف CSV بهذه الأعمدة الإلزامية:
// id, title, description, availability, condition, price, link, image_link, brand, google_product_category
function exportForFacebook(){
  var SHOP_URL='https://blueskymorgantown.github.io/lura-beauty-store/';
  var rows=[
    ['id','title','description','availability','condition','price','link','image_link','brand','google_product_category','custom_label_0']
  ];
  products.forEach(function(p){
    var avail=p.qty>0?'in stock':'out of stock';
    var price=p.price.toFixed(2)+' YER';
    var desc=p.desc||(p.nameAr+' — '+p.brand);
    var img=p.img&&p.img.startsWith('http')?p.img:'';
    var catNum={serum:'11734',cream:'11734',cleanser:'11734',sunscreen:'11734',eye:'11734',other:'11734'}[p.cat]||'11734';
    rows.push([
      'LURA-'+p.id,
      p.brand+' '+p.name,
      desc,
      avail,
      'new',
      price,
      SHOP_URL+'#product-'+p.id,
      img,
      p.brand,
      catNum,
      catLabels[p.cat]
    ]);
  });
  downloadCSV(rows,'lura-facebook-shop-'+today()+'.csv');
  showNotif('✓ تم تصدير ملف متجر فيسبوك');
}

// ── EXPORT: TIKTOK SHOP ───────────────────────────────────
// متجر تيك توك يقبل ملف CSV/Excel بهذه الأعمدة:
// Product Name, SKU, Description, Price, Currency, Stock, Category, Brand, Image URL, Condition
function exportForTiktok(){
  var rows=[
    ['Product Name','SKU ID','Description','Price','Currency','Stock Quantity','Category','Brand','Image URL','Condition','Product Status','Arabic Name']
  ];
  products.forEach(function(p){
    rows.push([
      p.brand+' - '+p.name,
      p.barcode||('LURA-'+p.id),
      p.desc||p.nameAr,
      p.price.toFixed(2),
      'YER',
      p.qty,
      catEn[p.cat]||'Health & Beauty',
      p.brand,
      p.img&&p.img.startsWith('http')?p.img:'',
      'New',
      p.qty>0?'Active':'Inactive',
      p.nameAr
    ]);
  });
  downloadCSV(rows,'lura-tiktok-shop-'+today()+'.csv');
  showNotif('✓ تم تصدير ملف متجر تيك توك');
}

function downloadCSV(rows,filename){
  var csv=rows.map(function(row){
    return row.map(function(cell){
      var s=String(cell==null?'':cell).replace(/"/g,'""');
      return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s+'"':s;
    }).join(',');
  }).join('\n');
  // Add BOM for Arabic UTF-8 support in Excel
  var bom='\uFEFF';
  var blob=new Blob([bom+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}
function today(){
  var d=new Date();
  return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');
}

// ── UTILS ─────────────────────────────────────────────────
function showNotif(msg,type){
  var n=document.getElementById('notif');
  n.textContent=msg;n.className='notif '+(type||'success');n.classList.add('show');
  clearTimeout(n._t);n._t=setTimeout(function(){n.classList.remove('show')},3000);
}

// Init
renderHome();renderStore();
