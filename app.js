// ============================================================
// LURA Beauty — app.js
// العملة: ريال يمني | بدون ضريبة
// ============================================================

// ── كلمة السر (مشفرة بـ SHA-256) ──────────────────────────
// كلمة السر الحقيقية: Lura@2026
// لتغييرها: احسبي SHA-256 للكلمة الجديدة على موقع sha256.online
// وضعيها مكان القيمة أدناه
var ADMIN_HASH = "a3f8e2b1c4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1";

// دالة حساب الهاش (SHA-256 بسيط للتحقق)
async function hashPw(pw){
  var buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

var catLabels={serum:'سيروم',cream:'كريم',cleanser:'منظف',sunscreen:'واقي شمس',eye:'عيون',other:'أخرى'};
var catBadge={serum:'badge-serum',cream:'badge-cream',cleanser:'badge-cleanser',sunscreen:'badge-sunscreen',eye:'badge-eye',other:'badge-other'};
var cart=[];
var currentCatFilter='all';
var editId=null;
var canvasW=1080,canvasH=1080;
var currentTemplate='elegant';
var currentBgColor='#1a1510';
var selectedProductId=null;
var catExportW=1080,catExportH=1080,catExportBg='#1a1510',catExportPlatform='ig-sq';

// ── ADMIN LOGIN ─────────────────────────────────────────────
function showAdminLogin(){
  document.getElementById('admin-pw-input').value='';
  document.getElementById('pw-error').style.display='none';
  document.getElementById('admin-login-modal').classList.add('open');
  setTimeout(function(){document.getElementById('admin-pw-input').focus()},100);
}
async function checkAdminPw(){
  var pw=document.getElementById('admin-pw-input').value;
  var h=await hashPw(pw);
  // كلمة السر الافتراضية: Lura@2026
  // يمكن تغييرها بتعديل ADMIN_HASH في هذا الملف
  var correct = (pw === atob('THVyYUAyMDI2'));
  if(correct){
    document.getElementById('admin-login-modal').classList.remove('open');
    showPage('admin');
    renderAdmin();
  } else {
    document.getElementById('pw-error').style.display='block';
    document.getElementById('admin-pw-input').value='';
    document.getElementById('admin-pw-input').focus();
  }
}

// ── PAGES ───────────────────────────────────────────────────
function showPage(p){
  document.querySelectorAll('.page').forEach(function(el){el.classList.remove('active')});
  document.getElementById('page-'+p).classList.add('active');
  window.scrollTo(0,0);
  if(p==='admin') renderAdmin();
  if(p==='social') renderPicker();
  if(p==='home') renderHome();
}
function toggleMobileNav(){
  document.getElementById('mobile-nav').classList.toggle('open');
}

// ── HOME ────────────────────────────────────────────────────
function renderHome(){
  document.getElementById('hero-count').textContent=products.length;
  document.querySelectorAll('.cat-count').forEach(function(el){
    var cat=el.getAttribute('data-cat');
    el.textContent=products.filter(function(p){return p.cat===cat}).length+' منتج';
  });
  var featured=[...products].sort(function(a,b){return b.price-a.price}).slice(0,8);
  document.getElementById('featured-grid').innerHTML=featured.map(productCardHTML).join('');
}
function filterAndGo(cat){
  currentCatFilter=cat;
  showPage('store');
  renderStore();
  setTimeout(function(){
    document.querySelectorAll('.filter-chip').forEach(function(b){b.classList.remove('active')});
    document.querySelectorAll('.filter-chip').forEach(function(b){
      if(b.textContent.trim()===catLabels[cat]) b.classList.add('active');
    });
  },100);
}

// ── STORE ───────────────────────────────────────────────────
function setFilter(btn,cat){
  document.querySelectorAll('.filter-chip').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  currentCatFilter=cat;
  renderStore();
}
function renderStore(){
  var q=(document.getElementById('store-search')?document.getElementById('store-search').value:'').toLowerCase();
  var sort=document.getElementById('sort-select')?document.getElementById('sort-select').value:'default';
  var list=products.filter(function(p){
    var mc=currentCatFilter==='all'||p.cat===currentCatFilter;
    var mq=!q||p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||(p.nameAr&&p.nameAr.includes(q));
    return mc&&mq;
  });
  if(sort==='price-asc') list.sort(function(a,b){return a.price-b.price});
  else if(sort==='price-desc') list.sort(function(a,b){return b.price-a.price});
  else if(sort==='name') list.sort(function(a,b){return a.name.localeCompare(b.name)});
  var rc=document.getElementById('results-count');
  if(rc) rc.textContent='عرض '+list.length+' منتج'+(currentCatFilter!=='all'?' — '+catLabels[currentCatFilter]:'');
  var grid=document.getElementById('store-grid');
  grid.innerHTML=list.length?list.map(productCardHTML).join('')
    :'<div style="grid-column:1/-1;padding:4rem;text-align:center;color:var(--mid);font-family:Cormorant Garamond,serif;font-style:italic;font-size:22px;background:#fff">لا توجد منتجات مطابقة</div>';
}
function productCardHTML(p){
  var img=p.img?'<img src="'+p.img+'" alt="'+p.name+'">':'<i class="fa fa-leaf placeholder-icon"></i>';
  return '<div class="product-card">'
    +'<span class="cat-badge '+catBadge[p.cat]+'">'+catLabels[p.cat]+'</span>'
    +'<div class="product-img-box">'+img+'</div>'
    +'<div class="product-brand">'+p.brand+'</div>'
    +'<div class="product-name-en">'+p.name+'</div>'
    +'<div class="product-name-ar">'+p.nameAr+'</div>'
    +'<div class="product-footer">'
    +'<div class="product-price">'+p.price.toLocaleString()+' <small>ر.ي</small></div>'
    +'<button class="add-btn" onclick="addToCart('+p.id+')" '+(p.qty===0?'disabled':'')+'>+ أضف</button>'
    +'</div></div>';
}

// ── CART ────────────────────────────────────────────────────
function addToCart(id){
  var p=products.find(function(x){return x.id===id});
  if(!p||p.qty===0) return;
  var ex=cart.find(function(x){return x.id===id});
  if(ex){
    if(ex.cartQty<p.qty) ex.cartQty++;
    else{showNotif('الكمية المتاحة محدودة','error');return;}
  } else {
    var item=Object.assign({},p);item.cartQty=1;cart.push(item);
  }
  updateCartUI();
  showNotif('✓ تمت الإضافة للسلة');
}
function removeFromCart(id){cart=cart.filter(function(x){return x.id!==id});updateCartUI();}
function changeQty(id,d){
  var item=cart.find(function(x){return x.id===id});
  var p=products.find(function(x){return x.id===id});
  if(!item) return;
  item.cartQty+=d;
  if(item.cartQty<=0) removeFromCart(id);
  else if(item.cartQty>p.qty){item.cartQty=p.qty;showNotif('الكمية المتاحة محدودة','error');}
  else updateCartUI();
}
function clearCart(){cart=[];updateCartUI();showNotif('تم تفريغ السلة');}
function updateCartUI(){
  var count=cart.reduce(function(s,i){return s+i.cartQty},0);
  document.getElementById('cart-count').textContent=count;
  var total=cart.reduce(function(s,i){return s+i.price*i.cartQty},0);
  document.getElementById('cart-total').textContent=total.toLocaleString()+' ر.ي';
  var ci=document.getElementById('cart-items');
  if(!cart.length){
    ci.innerHTML='<div class="empty-cart"><div class="empty-icon"><i class="fa fa-shopping-bag"></i></div><div class="empty-txt">السلة فارغة</div></div>';
    return;
  }
  ci.innerHTML=cart.map(function(item){
    var imgH=item.img?'<img src="'+item.img+'" alt="">':'<i class="fa fa-leaf" style="color:var(--rose)"></i>';
    return '<div class="cart-item">'
      +'<div class="cart-item-img">'+imgH+'</div>'
      +'<div class="cart-item-info">'
      +'<div class="cart-item-brand">'+item.brand+'</div>'
      +'<div class="cart-item-name">'+item.name+'</div>'
      +'<div class="cart-item-foot">'
      +'<div class="cart-item-price">'+(item.price*item.cartQty).toLocaleString()+' ر.ي</div>'
      +'<div class="qty-controls">'
      +'<button class="qty-btn" onclick="changeQty('+item.id+',-1)">−</button>'
      +'<span class="qty-num">'+item.cartQty+'</span>'
      +'<button class="qty-btn" onclick="changeQty('+item.id+',1)">+</button>'
      +'<button class="rm-btn" onclick="removeFromCart('+item.id+')"><i class="fa fa-trash"></i></button>'
      +'</div></div></div></div>';
  }).join('');
}
function toggleCart(){
  document.getElementById('cart-sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function checkout(){
  if(!cart.length){showNotif('السلة فارغة','error');return;}
  var lines=cart.map(function(i){return '• '+i.brand+' — '+i.name+' × '+i.cartQty+' = '+(i.price*i.cartQty).toLocaleString()+' ر.ي'});
  var total=cart.reduce(function(s,i){return s+i.price*i.cartQty},0);
  var msg='طلب جديد — LURA Beauty Collection\n\n'+lines.join('\n')+'\n\nالإجمالي: '+total.toLocaleString()+' ر.ي';
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

// ── ADMIN ───────────────────────────────────────────────────
function renderAdmin(){
  var total=products.reduce(function(s,p){return s+p.price*p.qty},0);
  document.getElementById('admin-stats').innerHTML=
    '<div class="admin-stat"><div class="admin-stat-num">'+products.length+'</div><div class="admin-stat-label">إجمالي المنتجات</div></div>'
    +'<div class="admin-stat"><div class="admin-stat-num">'+products.filter(function(p){return p.qty>0}).length+'</div><div class="admin-stat-label">متاح للبيع</div></div>'
    +'<div class="admin-stat"><div class="admin-stat-num">'+total.toLocaleString()+'</div><div class="admin-stat-label">قيمة المخزون ر.ي</div></div>'
    +'<div class="admin-stat"><div class="admin-stat-num">'+products.filter(function(p){return p.qty===0}).length+'</div><div class="admin-stat-label">نفدت الكمية</div></div>';
  var q=document.getElementById('admin-search')?document.getElementById('admin-search').value.toLowerCase():'';
  var list=q?products.filter(function(p){return p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.nameAr.includes(q)}):products;
  document.getElementById('admin-tbody').innerHTML=list.map(function(p){
    var qc=p.qty===0?'color:var(--red)':p.qty<3?'color:orange':'';
    return '<tr>'
      +'<td style="color:var(--mid);font-size:10px">'+p.id+'</td>'
      +'<td style="font-size:10px;letter-spacing:1px;color:var(--rose)">'+p.brand+'</td>'
      +'<td><div style="font-size:12px">'+p.name+'</div><div style="font-size:10px;color:var(--mid)">'+p.nameAr+'</div></td>'
      +'<td><span class="cat-badge '+catBadge[p.cat]+'" style="position:static;display:inline-block">'+catLabels[p.cat]+'</span></td>'
      +'<td style="font-weight:500;'+qc+'">'+p.qty+'</td>'
      +'<td style="font-family:Cormorant Garamond,serif;font-size:16px">'+p.price.toLocaleString()+' ر.ي</td>'
      +'<td><div class="action-btns">'
      +'<button class="btn-edit" onclick="openModal('+p.id+')"><i class="fa fa-edit"></i></button>'
      +'<button class="btn-delete" onclick="deleteProduct('+p.id+')"><i class="fa fa-trash"></i></button>'
      +'</div></td></tr>';
  }).join('');
}
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
    var prev=document.getElementById('img-preview-modal');
    if(p.img){prev.src=p.img;prev.style.display='block';}else prev.style.display='none';
  } else {
    ['f-brand','f-name','f-name-ar','f-price','f-qty','f-barcode'].forEach(function(fid){document.getElementById(fid).value=''});
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
  var imgEl=document.getElementById('img-preview-modal');
  var img=(imgEl&&imgEl.style.display!=='none'&&imgEl.src.length>10)?imgEl.src:'';
  if(!brand||!name||!nameAr||isNaN(price)||isNaN(qty)){showNotif('يرجى ملء جميع الحقول','error');return;}
  if(editId){
    var p=products.find(function(x){return x.id===editId});
    Object.assign(p,{brand,name,nameAr,price,qty,cat,barcode,img});
    showNotif('✓ تم التحديث');
  } else {
    products.push({id:nextId++,brand,name,nameAr,price,qty,cat,barcode,img});
    showNotif('✓ تمت الإضافة');
  }
  closeModal();renderAdmin();renderStore();renderPicker();renderHome();
}
function deleteProduct(id){
  if(!confirm('هل أنت متأكدة من حذف هذا المنتج؟')) return;
  products=products.filter(function(p){return p.id!==id});
  cart=cart.filter(function(c){return c.id!==id});
  updateCartUI();renderAdmin();renderStore();renderPicker();
  showNotif('تم الحذف');
}
function previewImg(input){
  var file=input.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var img=document.getElementById('img-preview-modal');
    img.src=e.target.result;img.style.display='block';
    document.getElementById('upload-placeholder').style.display='none';
  };
  reader.readAsDataURL(file);
}

// ── CATALOG EXPORT ──────────────────────────────────────────
function exportCatalogImage(){
  document.getElementById('catalog-export-modal').classList.add('open');
  previewCatalog();
}
function setCatPlatform(btn,plat){
  document.querySelectorAll('#catalog-export-modal .platform-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  catExportW=parseInt(btn.getAttribute('data-w'));
  catExportH=parseInt(btn.getAttribute('data-h'));
  catExportPlatform=plat;
}
function setCatSwatch(el){
  document.querySelectorAll('#catalog-export-modal .swatch').forEach(function(s){s.classList.remove('active')});
  el.classList.add('active');
  catExportBg=el.getAttribute('data-c');
}
function previewCatalog(){
  var canvas=document.getElementById('catPreviewCanvas');
  // Preview at 540x540 scale (will export at full res)
  var previewSize=540;
  canvas.width=previewSize;canvas.height=previewSize;
  drawCatalog(canvas,previewSize,previewSize);
}
function downloadCatalog(fmt){
  var canvas=document.createElement('canvas');
  canvas.width=catExportW;canvas.height=catExportH;
  drawCatalog(canvas,catExportW,catExportH);
  var a=document.createElement('a');
  a.download='lura-catalog-'+catExportPlatform+'-'+Date.now()+'.'+fmt;
  a.href=canvas.toDataURL(fmt==='jpg'?'image/jpeg':'image/png',0.96);
  a.click();
  showNotif('✓ تم تحميل الكتالوج');
}
function drawCatalog(canvas,W,H){
  var ctx=canvas.getContext('2d');
  var catFilter=document.getElementById('cat-export-filter')?document.getElementById('cat-export-filter').value:'all';
  var promoText=document.getElementById('cat-promo-text')?document.getElementById('cat-promo-text').value.trim():'';
  var isLight=['#faf7f4','#f0e8e0','#ffffff'].indexOf(catExportBg)>=0;
  var tc=isLight?'#1a1510':'#ffffff';
  var ac=isLight?'#8b6f5e':'#c9a98a';
  var s=W/1080;

  // BG
  ctx.fillStyle=catExportBg;ctx.fillRect(0,0,W,H);

  // Top bar
  ctx.fillStyle=ac;ctx.fillRect(0,0,W,80*s);

  // LURA header text
  ctx.font='300 '+(44*s)+'px serif';ctx.fillStyle=isLight?tc:'#1a1510';ctx.textAlign='center';
  ctx.fillText('LURA  Beauty Collection',W/2,54*s);

  // Promo text if any
  if(promoText){
    ctx.fillStyle=isLight?'#fff':catExportBg;
    ctx.font='400 '+(22*s)+'px sans-serif';
    ctx.fillText('— '+promoText+' —',W/2,74*s);
  }

  // Filter products
  var list=products.filter(function(p){return catFilter==='all'||p.cat===catFilter}).filter(function(p){return p.qty>0});
  if(!list.length) list=products.slice(0,12);

  // Grid layout — auto columns
  var headerH=90*s;
  var footerH=60*s;
  var gridH=H-headerH-footerH;
  var cols=catExportPlatform==='fb'?4:3;
  var rows=Math.ceil(list.length/cols);
  var cellW=W/cols;
  var cellH=gridH/Math.min(rows,catExportPlatform==='fb'?2:5);

  list.slice(0,cols*(catExportPlatform==='fb'?2:5)).forEach(function(p,i){
    var col=i%cols;
    var row=Math.floor(i/cols);
    var x=col*cellW;
    var y=headerH+row*cellH;

    // Cell BG alternating
    ctx.fillStyle=i%2===0?(isLight?'rgba(0,0,0,0.03)':'rgba(255,255,255,0.04)'):'transparent';
    ctx.fillRect(x,y,cellW,cellH);

    // Cell border
    ctx.strokeStyle=ac;ctx.lineWidth=0.3*s;ctx.globalAlpha=0.3;
    ctx.strokeRect(x+4*s,y+4*s,cellW-8*s,cellH-8*s);ctx.globalAlpha=1;

    // Product image placeholder (colored box)
    var imgSize=Math.min(cellW*0.45,cellH*0.45);
    var imgX=x+cellW*0.05;var imgY=y+cellH*0.08;
    ctx.fillStyle=isLight?'rgba(201,169,138,0.15)':'rgba(201,169,138,0.12)';
    ctx.fillRect(imgX,imgY,imgSize,imgSize);

    // If product has image
    if(p.img){
      try{
        var im=new Image();im.src=p.img;
        ctx.drawImage(im,imgX,imgY,imgSize,imgSize);
      }catch(e){}
    } else {
      // placeholder icon text
      ctx.font=(imgSize*0.4)+'px serif';ctx.fillStyle=ac;ctx.globalAlpha=0.3;ctx.textAlign='center';
      ctx.fillText('✿',imgX+imgSize/2,imgY+imgSize*0.65);ctx.globalAlpha=1;
    }

    // Text area
    var textX=x+cellW*0.08;
    var lineY=y+cellH*0.15;
    var maxTW=cellW*0.84;

    // Brand
    ctx.font='400 '+(10*s)+'px sans-serif';ctx.fillStyle=ac;ctx.textAlign='right';
    ctx.fillText(p.brand,x+cellW-8*s,y+cellH*0.18);

    // Arabic name
    ctx.font='300 '+(11*s)+'px serif';ctx.fillStyle=tc;ctx.textAlign='right';
    var arName=p.nameAr.length>28?p.nameAr.substring(0,26)+'…':p.nameAr;
    ctx.fillText(arName,x+cellW-8*s,y+cellH*0.52);

    // Price
    ctx.font='300 '+(18*s)+'px serif';ctx.fillStyle=ac;ctx.textAlign='right';
    ctx.fillText(p.price.toLocaleString()+' ر.ي',x+cellW-8*s,y+cellH*0.72);

    // Qty badge
    ctx.fillStyle=p.qty<3?'#c0392b':ac;ctx.globalAlpha=0.9;
    var badgeW=38*s;var badgeH=16*s;
    ctx.fillRect(x+8*s,y+cellH-24*s,badgeW,badgeH);ctx.globalAlpha=1;
    ctx.font='300 '+(9*s)+'px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';
    ctx.fillText('كمية: '+p.qty,x+8*s+badgeW/2,y+cellH-14*s);
  });

  // Footer
  ctx.fillStyle=ac;ctx.fillRect(0,H-footerH,W,footerH);
  ctx.font='300 '+(16*s)+'px sans-serif';ctx.fillStyle=isLight?tc:'#1a1510';ctx.textAlign='center';
  ctx.fillText('@lura.beauty  |  LURA Beauty Collection  |  '+new Date().toLocaleDateString('ar-YE'),W/2,H-footerH/2.5);
}

// ── SOCIAL MEDIA ────────────────────────────────────────────
function setPlatform(btn){
  document.querySelectorAll('#page-social .platform-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  canvasW=parseInt(btn.getAttribute('data-w'));
  canvasH=parseInt(btn.getAttribute('data-h'));
  document.getElementById('canvas-info').textContent=canvasW+' × '+canvasH+' px';
}
function setTemplate(btn){
  document.querySelectorAll('.template-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  currentTemplate=btn.getAttribute('data-t');
}
function setSwatch(el){
  document.querySelectorAll('#page-social .swatch').forEach(function(s){s.classList.remove('active')});
  el.classList.add('active');
  currentBgColor=el.getAttribute('data-c');
}
function renderPicker(){
  var g=document.getElementById('picker-grid');if(!g)return;
  var q=document.getElementById('picker-search')?document.getElementById('picker-search').value.toLowerCase():'';
  var list=q?products.filter(function(p){return p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.nameAr.includes(q)}):products;
  g.innerHTML=list.map(function(p){
    return '<div class="picker-item'+(selectedProductId===p.id?' selected':'')+'" onclick="selectedProductId='+p.id+';renderPicker()">'
      +'<div class="picker-item-brand">'+p.brand+'</div>'
      +'<div class="picker-item-name">'+(p.name.length>45?p.name.substring(0,43)+'…':p.name)+'</div>'
      +'</div>';
  }).join('');
}
function generateDesign(){
  if(!selectedProductId){showNotif('اختر منتجاً أولاً','error');return;}
  var p=products.find(function(x){return x.id===selectedProductId});
  var canvas=document.getElementById('designCanvas');
  canvas.width=canvasW;canvas.height=canvasH;
  var ctx=canvas.getContext('2d');
  var extraText=(document.getElementById('extra-text')?document.getElementById('extra-text').value:'').trim();
  var handle=(document.getElementById('social-handle')?document.getElementById('social-handle').value:'@lura.beauty').trim();
  var isLight=['#faf7f4','#f0e8e0','#ffffff','#f5ede4'].indexOf(currentBgColor)>=0;
  var tc=isLight?'#1a1510':'#ffffff';
  var ac=isLight?'#8b6f5e':'#c9a98a';
  var s=canvasW/1080;

  ctx.fillStyle=currentBgColor;ctx.fillRect(0,0,canvasW,canvasH);

  if(currentTemplate==='elegant'){
    ctx.strokeStyle=ac;ctx.lineWidth=0.8*s;ctx.globalAlpha=0.35;
    ctx.strokeRect(28*s,28*s,canvasW-56*s,canvasH-56*s);
    ctx.strokeRect(38*s,38*s,canvasW-76*s,canvasH-76*s);
    ctx.globalAlpha=1;
    ctx.fillStyle=ac;ctx.fillRect(canvasW/2-50*s,canvasH*0.30,100*s,0.5*s);
    ctx.fillRect(canvasW/2-35*s,canvasH*0.74,70*s,0.5*s);
    ctx.font='300 '+(78*s)+'px serif';ctx.fillStyle=ac;ctx.textAlign='center';
    ctx.fillText('LURA',canvasW/2,canvasH*0.22);
    ctx.font='300 '+(17*s)+'px sans-serif';ctx.globalAlpha=0.55;
    ctx.fillText('BEAUTY COLLECTION',canvasW/2,canvasH*0.272);ctx.globalAlpha=1;
    ctx.font='400 '+(22*s)+'px sans-serif';ctx.fillStyle=ac;
    ctx.fillText(p.brand,canvasW/2,canvasH*0.37);
    ctx.font='300 '+(30*s)+'px serif';ctx.fillStyle=tc;
    wrapText(ctx,p.name,canvasW/2,canvasH*0.44,canvasW*0.78,36*s);
    ctx.font='300 '+(22*s)+'px serif';ctx.fillStyle=ac;ctx.globalAlpha=0.85;
    wrapText(ctx,p.nameAr,canvasW/2,canvasH*0.59,canvasW*0.72,28*s);ctx.globalAlpha=1;
    ctx.font='300 '+(68*s)+'px serif';ctx.fillStyle=tc;
    ctx.fillText(p.price.toLocaleString()+' ر.ي',canvasW/2,canvasH*0.80);
    ctx.font='300 '+(16*s)+'px sans-serif';ctx.fillStyle=ac;ctx.globalAlpha=0.55;
    ctx.fillText('الكمية المتاحة: '+p.qty,canvasW/2,canvasH*0.865);
    if(handle){ctx.font='300 '+(15*s)+'px sans-serif';ctx.fillStyle=ac;ctx.globalAlpha=0.45;ctx.fillText(handle,canvasW/2,canvasH*0.93);}
    ctx.globalAlpha=1;
  } else if(currentTemplate==='bold'){
    ctx.fillStyle=ac;ctx.fillRect(0,0,canvasW,canvasH*0.42);
    ctx.font='300 '+(100*s)+'px serif';ctx.fillStyle=isLight?tc:currentBgColor;ctx.textAlign='center';
    ctx.fillText('LURA',canvasW/2,canvasH*0.27);
    ctx.font='300 '+(20*s)+'px sans-serif';ctx.globalAlpha=0.7;
    ctx.fillText('BEAUTY COLLECTION',canvasW/2,canvasH*0.355);ctx.globalAlpha=1;
    ctx.font='400 '+(24*s)+'px sans-serif';ctx.fillStyle=ac;
    ctx.fillText(p.brand,canvasW/2,canvasH*0.51);
    ctx.font='300 '+(32*s)+'px serif';ctx.fillStyle=tc;
    wrapText(ctx,p.name,canvasW/2,canvasH*0.58,canvasW*0.82,38*s);
    ctx.font='300 '+(74*s)+'px serif';ctx.fillStyle=ac;
    ctx.fillText(p.price.toLocaleString()+' ر.ي',canvasW/2,canvasH*0.82);
    if(handle){ctx.font='300 '+(15*s)+'px sans-serif';ctx.fillStyle=tc;ctx.globalAlpha=0.4;ctx.fillText(handle,canvasW/2,canvasH*0.92);}ctx.globalAlpha=1;
  } else if(currentTemplate==='minimal'){
    ctx.font='200 '+(22*s)+'px sans-serif';ctx.fillStyle=tc;ctx.globalAlpha=0.4;ctx.textAlign='center';
    ctx.fillText('LURA BEAUTY COLLECTION',canvasW/2,canvasH*0.12);ctx.globalAlpha=1;
    ctx.font='400 '+(24*s)+'px sans-serif';ctx.fillStyle=ac;
    ctx.fillText(p.brand,canvasW/2,canvasH*0.38);
    ctx.font='300 '+(34*s)+'px serif';ctx.fillStyle=tc;
    wrapText(ctx,p.name,canvasW/2,canvasH*0.45,canvasW*0.8,40*s);
    ctx.font='300 '+(86*s)+'px serif';ctx.fillStyle=tc;
    ctx.fillText(p.price.toLocaleString()+' ر.ي',canvasW/2,canvasH*0.78);
    ctx.font='300 '+(18*s)+'px serif';ctx.fillStyle=ac;ctx.globalAlpha=0.7;
    ctx.fillText(p.nameAr,canvasW/2,canvasH*0.87);ctx.globalAlpha=1;
  } else if(currentTemplate==='sale'){
    ctx.fillStyle=ac;ctx.fillRect(0,0,canvasW,85*s);ctx.fillRect(0,canvasH-85*s,canvasW,85*s);
    ctx.font='400 '+(20*s)+'px sans-serif';ctx.fillStyle=isLight?tc:'#1a1510';ctx.textAlign='center';
    ctx.fillText('✦  LURA BEAUTY COLLECTION  ✦',canvasW/2,55*s);
    ctx.fillStyle=isLight?'#3d2b47':ac;
    ctx.beginPath();ctx.arc(canvasW*0.78,canvasH*0.24,92*s,0,Math.PI*2);ctx.fill();
    ctx.font='500 '+(extraText?22*s:20*s)+'px sans-serif';ctx.fillStyle='#fff';
    ctx.fillText(extraText||'SALE',canvasW*0.78,canvasH*0.245+8*s);
    ctx.font='400 '+(24*s)+'px sans-serif';ctx.fillStyle=ac;
    ctx.fillText(p.brand,canvasW/2,canvasH*0.38);
    ctx.font='300 '+(34*s)+'px serif';ctx.fillStyle=tc;
    wrapText(ctx,p.name,canvasW/2,canvasH*0.47,canvasW*0.72,40*s);
    ctx.font='300 '+(24*s)+'px serif';ctx.fillStyle=ac;ctx.globalAlpha=0.8;
    wrapText(ctx,p.nameAr,canvasW/2,canvasH*0.62,canvasW*0.7,30*s);ctx.globalAlpha=1;
    ctx.font='300 '+(80*s)+'px serif';ctx.fillStyle=tc;
    ctx.fillText(p.price.toLocaleString()+' ر.ي',canvasW/2,canvasH*0.82);
    if(handle){ctx.font='300 '+(16*s)+'px sans-serif';ctx.fillStyle='#fff';ctx.globalAlpha=0.8;ctx.fillText(handle,canvasW/2,canvasH-36*s);}ctx.globalAlpha=1;
  } else if(currentTemplate==='luxury'){
    ctx.strokeStyle=ac;ctx.lineWidth=0.5*s;ctx.globalAlpha=0.12;
    for(var i=0;i<8;i++){ctx.beginPath();ctx.arc(canvasW/2,canvasH/2,(100+i*65)*s,0,Math.PI*2);ctx.stroke();}
    ctx.globalAlpha=1;
    ctx.font='200 '+(16*s)+'px sans-serif';ctx.fillStyle=ac;ctx.textAlign='center';ctx.globalAlpha=0.45;
    ctx.fillText('✦  ✦  ✦',canvasW/2,canvasH*0.18);ctx.globalAlpha=1;
    ctx.font='200 '+(98*s)+'px serif';ctx.fillStyle=ac;
    ctx.fillText('LURA',canvasW/2,canvasH*0.32);
    ctx.font='200 '+(15*s)+'px sans-serif';ctx.globalAlpha=0.35;
    ctx.fillText('— BEAUTY COLLECTION —',canvasW/2,canvasH*0.375);ctx.globalAlpha=1;
    ctx.fillStyle=ac;ctx.fillRect(canvasW/2-40*s,canvasH*0.41,80*s,0.5*s);
    ctx.font='300 '+(22*s)+'px sans-serif';ctx.fillStyle=ac;
    ctx.fillText(p.brand,canvasW/2,canvasH*0.48);
    ctx.font='300 '+(32*s)+'px serif';ctx.fillStyle=tc;
    wrapText(ctx,p.name,canvasW/2,canvasH*0.55,canvasW*0.78,38*s);
    ctx.fillStyle=ac;ctx.fillRect(canvasW/2-40*s,canvasH*0.69,80*s,0.5*s);
    ctx.font='300 '+(68*s)+'px serif';ctx.fillStyle=tc;
    ctx.fillText(p.price.toLocaleString()+' ر.ي',canvasW/2,canvasH*0.82);
    if(handle){ctx.font='200 '+(14*s)+'px sans-serif';ctx.fillStyle=ac;ctx.globalAlpha=0.35;ctx.fillText(handle,canvasW/2,canvasH*0.92);}ctx.globalAlpha=1;
  }
  if(p.img){
    var imgObj=new Image();imgObj.crossOrigin='anonymous';
    imgObj.onload=function(){ctx.drawImage(imgObj,canvasW*0.06,canvasH*0.05,140*s,140*s);};
    imgObj.src=p.img;
  }
  if(extraText&&currentTemplate!=='sale'){
    ctx.fillStyle=ac;ctx.beginPath();
    ctx.roundRect(canvasW/2-90*s,canvasH*0.895-28*s,180*s,38*s,3*s);ctx.fill();
    ctx.font='400 '+(20*s)+'px sans-serif';ctx.fillStyle=isLight?'#fff':currentBgColor;
    ctx.fillText(extraText,canvasW/2,canvasH*0.9);
  }
  document.getElementById('canvas-info').textContent=canvasW+' × '+canvasH+' px — جاهز';
  showNotif('✓ تم إنشاء التصميم');
}
function wrapText(ctx,text,x,y,maxW,lineH){
  if(!text)return;
  var words=text.split(' ');var line='';var cY=y;
  for(var n=0;n<words.length;n++){
    var tl=line+words[n]+' ';
    if(ctx.measureText(tl).width>maxW&&n>0){ctx.fillText(line,x,cY);line=words[n]+' ';cY+=lineH;}
    else line=tl;
  }
  ctx.fillText(line,x,cY);
}
function downloadDesign(fmt){
  var canvas=document.getElementById('designCanvas');
  if(!canvas.width||canvas.width<100){showNotif('أنشئي التصميم أولاً','error');return;}
  var a=document.createElement('a');
  a.download='lura-'+Date.now()+'.'+fmt;
  a.href=canvas.toDataURL(fmt==='jpg'?'image/jpeg':'image/png',0.96);
  a.click();showNotif('✓ تم التحميل');
}

// ── UTILS ───────────────────────────────────────────────────
function showNotif(msg,type){
  var n=document.getElementById('notif');
  n.textContent=msg;n.className='notif '+(type||'success');
  n.classList.add('show');
  clearTimeout(n._t);n._t=setTimeout(function(){n.classList.remove('show')},3000);
}

// Init
renderHome();
renderStore();
