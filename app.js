// ============================================================
// LURA Beauty — app.js — Firebase + Storage + Dynamic Cats
// ============================================================

var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCmMwIekwihFn7vzkH-m5_rdw-m2UQREIU",
  authDomain:        "lura-beauty.firebaseapp.com",
  projectId:         "lura-beauty",
  storageBucket:     "lura-beauty.firebasestorage.app",
  messagingSenderId: "111159791391",
  appId:             "1:111159791391:web:6101188aa782aa23ab6a2a"
};

// ── الإعدادات الافتراضية ──────────────────────────────────
var SETTINGS = {
  whatsapp:  "967780106461",
  storeName: "LURA Beauty Collection",
  storeUrl:  "https://blueskymorgantown.github.io/lura-beauty-store/"
};

// ── الفئات الافتراضية ─────────────────────────────────────
var DEFAULT_CATS = [
  {id:"serum",     label:"سيروم",     icon:"fa-flask"},
  {id:"cream",     label:"كريم",      icon:"fa-jar"},
  {id:"cleanser",  label:"منظف",      icon:"fa-droplet"},
  {id:"sunscreen", label:"واقي شمس", icon:"fa-sun"},
  {id:"eye",       label:"عيون",      icon:"fa-eye"},
  {id:"other",     label:"أخرى",      icon:"fa-star"}
];

var categories = [...DEFAULT_CATS];
var products = [];
var cart = [];
var currentCatFilter = 'all';
var editId = null;
var currentImgUrl = '';
var listView = false;
var db, storage;

// ── FIREBASE INIT ─────────────────────────────────────────
function initFirebase(){
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db      = firebase.firestore();
    storage = firebase.storage();
    // تحميل الإعدادات أولاً ثم الفئات ثم المنتجات
    loadSettings().then(function(){
      return loadCategories();
    }).then(function(){
      listenToProducts();
    });
  } catch(e){
    console.error('Firebase:', e);
    showNotif('خطأ في الاتصال بقاعدة البيانات','error');
    hideLoading();
  }
}

// ── SETTINGS ─────────────────────────────────────────────
function loadSettings(){
  return db.collection('config').doc('settings').get().then(function(doc){
    if(doc.exists) Object.assign(SETTINGS, doc.data());
  }).catch(function(){});
}
function openSettings(){
  document.getElementById('setting-whatsapp').value  = SETTINGS.whatsapp;
  document.getElementById('setting-storename').value = SETTINGS.storeName;
  document.getElementById('setting-storeurl').value  = SETTINGS.storeUrl;
  document.getElementById('settings-modal').classList.add('open');
}
function saveSettings(){
  SETTINGS.whatsapp  = document.getElementById('setting-whatsapp').value.trim().replace(/[^0-9]/g,'');
  SETTINGS.storeName = document.getElementById('setting-storename').value.trim()||'LURA Beauty Collection';
  SETTINGS.storeUrl  = document.getElementById('setting-storeurl').value.trim();
  db.collection('config').doc('settings').set(SETTINGS).then(function(){
    document.getElementById('settings-modal').classList.remove('open');
    showNotif('✓ تم حفظ الإعدادات');
  }).catch(function(){showNotif('خطأ في الحفظ','error');});
}

// ── CATEGORIES ────────────────────────────────────────────
function loadCategories(){
  return db.collection('config').doc('categories').get().then(function(doc){
    if(doc.exists && doc.data().list && doc.data().list.length){
      categories = doc.data().list;
    }
    buildFilterChips();
    buildCatSelect();
  }).catch(function(){
    buildFilterChips(); buildCatSelect();
  });
}
function saveCategories(){
  return db.collection('config').doc('categories').set({list: categories});
}
function buildFilterChips(){
  var wrap = document.getElementById('filter-chips-wrap');
  wrap.innerHTML = '<button class="filter-chip'+(currentCatFilter==='all'?' active':'')+'" onclick="setFilter(this,\'all\')">الكل</button>';
  categories.forEach(function(c){
    var count = products.filter(function(p){return p.cat===c.id}).length;
    wrap.innerHTML += '<button class="filter-chip'+(currentCatFilter===c.id?' active':'')+'" onclick="setFilter(this,\''+c.id+'\')">'
      +c.label+' <span style="opacity:.5;font-size:9px">('+count+')</span></button>';
  });
}
function buildCatSelect(){
  var sel = document.getElementById('f-cat');
  if(!sel) return;
  sel.innerHTML = categories.map(function(c){
    return '<option value="'+c.id+'">'+c.label+'</option>';
  }).join('');
}
function getCatLabel(id){
  var c = categories.find(function(x){return x.id===id});
  return c ? c.label : id;
}
function getCatBadgeClass(id){
  var map = {serum:'badge-serum',cream:'badge-cream',cleanser:'badge-cleanser',
             sunscreen:'badge-sunscreen',eye:'badge-eye',other:'badge-other'};
  return map[id] || 'badge-other';
}
function getCatIcon(id){
  var c = categories.find(function(x){return x.id===id});
  return c ? (c.icon||'fa-tag') : 'fa-tag';
}

// ── CATEGORY MANAGER ──────────────────────────────────────
function openCatManager(){
  renderCatList();
  document.getElementById('cat-manager-modal').classList.add('open');
}
function renderCatList(){
  var list = document.getElementById('cat-list');
  list.innerHTML = categories.map(function(c){
    var count  = products.filter(function(p){return p.cat===c.id}).length;
    var isDef  = DEFAULT_CATS.some(function(d){return d.id===c.id});
    return '<div class="cat-item">'
      +'<div class="cat-item-info">'
      +'<span class="cat-item-id">'+c.id+'</span>'
      +'<span class="cat-item-label">'+c.label+'</span>'
      +'<span class="cat-item-count">'+count+' منتج</span>'
      +(isDef?'<span class="default-cat-badge">افتراضية</span>':'')
      +'</div>'
      +'<button class="btn-del-cat" onclick="deleteCategory(\''+c.id+'\')" '+(count>0?'title="توجد منتجات في هذه الفئة"':'')+'>'
      +'<i class="fa fa-trash"></i>'+(isDef?' (مخفي)':' حذف')+'</button>'
      +'</div>';
  }).join('');
}
function addCategory(){
  var id    = document.getElementById('new-cat-id').value.trim().toLowerCase().replace(/\s+/g,'-');
  var label = document.getElementById('new-cat-label').value.trim();
  if(!id||!label){showNotif('أدخلي المعرف والاسم','error');return;}
  if(categories.some(function(c){return c.id===id})){showNotif('هذه الفئة موجودة مسبقاً','error');return;}
  categories.push({id:id, label:label, icon:'fa-tag'});
  saveCategories().then(function(){
    document.getElementById('new-cat-id').value = '';
    document.getElementById('new-cat-label').value = '';
    buildFilterChips(); buildCatSelect(); renderCatList();
    showNotif('✓ تمت إضافة الفئة: '+label);
  });
}
function deleteCategory(id){
  var count = products.filter(function(p){return p.cat===id}).length;
  if(count > 0){
    if(!confirm('توجد '+count+' منتج في هذه الفئة. هل تريدين حذفها؟ ستصبح المنتجات بدون فئة محددة.')) return;
  } else {
    if(!confirm('هل أنت متأكدة من حذف هذه الفئة؟')) return;
  }
  categories = categories.filter(function(c){return c.id!==id});
  saveCategories().then(function(){
    buildFilterChips(); buildCatSelect(); renderCatList();
    renderHome(); renderAdmin();
    showNotif('تم حذف الفئة');
  });
}

// ── PRODUCTS REALTIME ─────────────────────────────────────
function listenToProducts(){
  db.collection('products').orderBy('id','asc')
    .onSnapshot(function(snap){
      products = [];
      snap.forEach(function(doc){
        products.push(Object.assign({_id: doc.id}, doc.data()));
      });
      if(products.length === 0){
        uploadInitialProducts();
      } else {
        hideLoading();
        renderHome(); renderStore();
        buildFilterChips();
        if(document.getElementById('page-admin').classList.contains('active')) renderAdmin();
      }
    }, function(err){
      console.error(err);
      showNotif('تعذّر الاتصال بقاعدة البيانات','error');
      hideLoading();
    });
}
function uploadInitialProducts(){
  showNotif('جارٍ تحميل المنتجات لأول مرة...');
  var batch = db.batch();
  initialProducts.forEach(function(p){
    batch.set(db.collection('products').doc('p'+p.id), p);
  });
  batch.commit().then(function(){
    showNotif('✓ تم تحميل '+initialProducts.length+' منتج');
  }).catch(function(e){
    showNotif('خطأ في رفع المنتجات','error');
    hideLoading();
  });
}

// ── LOADING ───────────────────────────────────────────────
function hideLoading(){
  var el = document.getElementById('loading-screen');
  el.classList.add('hidden');
  setTimeout(function(){el.style.display='none'},600);
}

// ── LOGIN ─────────────────────────────────────────────────
function showAdminLogin(){
  document.getElementById('admin-pw-input').value = '';
  document.getElementById('pw-error').style.display = 'none';
  document.getElementById('admin-login-modal').classList.add('open');
  setTimeout(function(){document.getElementById('admin-pw-input').focus()},150);
}
function closeLoginModal(){document.getElementById('admin-login-modal').classList.remove('open');}
function checkAdminPw(){
  if(document.getElementById('admin-pw-input').value === atob('THVyYUAyMDI2')){
    closeLoginModal(); showPage('admin'); renderAdmin();
  } else {
    document.getElementById('pw-error').style.display = 'block';
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('admin-pw-input').focus();
  }
}

// ── PAGES ─────────────────────────────────────────────────
function showPage(p){
  document.querySelectorAll('.page').forEach(function(e){e.classList.remove('active')});
  document.getElementById('page-'+p).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(p==='admin') renderAdmin();
  if(p==='home')  renderHome();
}
function toggleMobileNav(){document.getElementById('mobile-nav').classList.toggle('open');}
function scrollToCategories(){
  document.getElementById('categories-section').scrollIntoView({behavior:'smooth'});
}
function toggleView(){
  listView = !listView;
  var grid = document.getElementById('store-grid');
  var btn  = document.getElementById('view-toggle');
  grid.classList.toggle('list-view', listView);
  btn.innerHTML = listView ? '<i class="fa fa-th-large"></i>' : '<i class="fa fa-th"></i>';
}

// ── HOME ──────────────────────────────────────────────────
function renderHome(){
  document.getElementById('hero-count').textContent = products.length;
  document.getElementById('hero-cats').textContent  = categories.length;
  // Cat grid
  var catGrid = document.getElementById('home-cat-grid');
  catGrid.innerHTML = categories.map(function(c){
    var count = products.filter(function(p){return p.cat===c.id}).length;
    return '<div class="cat-card" onclick="filterAndGo(\''+c.id+'\')">'
      +'<i class="fa '+(c.icon||'fa-tag')+' cat-icon"></i>'
      +'<div class="cat-name">'+c.label+'</div>'
      +'<div class="cat-count">'+count+' منتج</div>'
      +'</div>';
  }).join('');
  // Featured — top 8 by price
  var featured = [...products].sort(function(a,b){return b.price-a.price}).slice(0,8);
  document.getElementById('featured-grid').innerHTML = featured.map(function(p){
    return cardHTML(p, true);
  }).join('');
  // New arrivals — last added
  var newest = [...products].reverse().slice(0,10);
  document.getElementById('new-arrivals').innerHTML = newest.map(function(p){
    return '<div class="scroll-card">'
      +'<div class="product-img-box" style="border-radius:8px;margin-bottom:.75rem;width:100%;aspect-ratio:1">'
      +(p.img?'<img src="'+p.img+'" alt="'+p.name+'">':'<i class="fa fa-leaf placeholder-icon"></i>')+'</div>'
      +'<div class="product-brand" style="font-size:8px;margin-bottom:3px">'+p.brand+'</div>'
      +'<div style="font-family:Cormorant Garamond,serif;font-size:14px;line-height:1.3;margin-bottom:.5rem">'+p.nameAr+'</div>'
      +'<div style="font-family:Cormorant Garamond,serif;font-size:18px;color:var(--accent)">'+p.price.toLocaleString()+' <small style="font-size:10px;font-family:Jost,sans-serif;color:var(--mid)">ر.ي</small></div>'
      +'</div>';
  }).join('');
}
function filterAndGo(cat){
  currentCatFilter = cat; showPage('store'); renderStore();
  setTimeout(function(){
    document.querySelectorAll('.filter-chip').forEach(function(b){b.classList.remove('active')});
    document.querySelectorAll('.filter-chip').forEach(function(b){
      var c = categories.find(function(x){return x.label===b.textContent.trim().replace(/\s*\(\d+\)\s*/,'')});
      if(c && c.id===cat) b.classList.add('active');
    });
  },120);
}

// ── STORE ─────────────────────────────────────────────────
function setFilter(btn,cat){
  document.querySelectorAll('.filter-chip').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active'); currentCatFilter = cat; renderStore();
}
function renderStore(){
  var q  = (document.getElementById('store-search').value||'').toLowerCase();
  var s  = document.getElementById('sort-select').value;
  var list = products.filter(function(p){
    var mc = currentCatFilter==='all' || p.cat===currentCatFilter;
    var mq = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.nameAr&&p.nameAr.includes(q));
    return mc && mq;
  });
  if(s==='price-asc')  list.sort(function(a,b){return a.price-b.price});
  else if(s==='price-desc') list.sort(function(a,b){return b.price-a.price});
  else if(s==='name')  list.sort(function(a,b){return a.name.localeCompare(b.name)});
  var catName = currentCatFilter==='all' ? '' : ' — '+getCatLabel(currentCatFilter);
  document.getElementById('results-count').textContent = 'عرض '+list.length+' منتج'+catName;
  buildFilterChips();
  document.getElementById('store-grid').innerHTML = list.length ? list.map(function(p){return cardHTML(p,false)}).join('')
    : '<div style="grid-column:1/-1;padding:5rem;text-align:center;color:var(--mid);font-family:Cormorant Garamond,serif;font-style:italic;font-size:22px;background:#fff">لا توجد منتجات</div>';
}
function cardHTML(p, dark){
  var bg = dark ? 'background:rgba(255,255,255,0.04)' : '';
  var textC = dark ? 'color:#fff' : '';
  var midC  = dark ? 'color:rgba(255,255,255,.5)' : '';
  var borderC = dark ? 'border-color:rgba(255,255,255,.08)' : '';
  return '<div class="product-card" style="'+bg+'">'
    +'<span class="cat-badge '+getCatBadgeClass(p.cat)+'">'+getCatLabel(p.cat)+'</span>'
    +'<div class="product-img-box">'+(p.img?'<img src="'+p.img+'" alt="'+p.name+'">':'<i class="fa fa-leaf placeholder-icon"></i>')+'</div>'
    +'<div class="product-body">'
    +'<div class="product-brand">'+p.brand+'</div>'
    +'<div class="product-name-en" style="'+textC+'">'+p.name+'</div>'
    +'<div class="product-name-ar" style="'+midC+'">'+p.nameAr+'</div>'
    +'<div class="product-footer" style="'+borderC+'">'
    +'<div class="product-price" style="'+(dark?'color:var(--rose)':'')+'">'+p.price.toLocaleString()+' <small>ر.ي</small></div>'
    +'<button class="add-btn" onclick="addToCart(\''+p._id+'\')" '+(p.qty===0?'disabled':'')+' style="'+(dark?'background:var(--rose);color:var(--dark)':'')+'"><i class="fa fa-plus"></i> أضف</button>'
    +'</div></div></div>';
}

// ── CART ──────────────────────────────────────────────────
function addToCart(docId){
  var p = products.find(function(x){return x._id===docId});
  if(!p||p.qty===0) return;
  var ex = cart.find(function(x){return x._id===docId});
  if(ex){ if(ex.cq<p.qty) ex.cq++; else{showNotif('الكمية المتاحة محدودة','error');return;} }
  else  { var it=Object.assign({},p); it.cq=1; cart.push(it); }
  updateCartUI(); showNotif('✓ تمت الإضافة للسلة');
}
function removeFromCart(docId){cart=cart.filter(function(x){return x._id!==docId});updateCartUI();}
function changeQty(docId,d){
  var it=cart.find(function(x){return x._id===docId});
  var p=products.find(function(x){return x._id===docId});
  if(!it)return; it.cq+=d;
  if(it.cq<=0) removeFromCart(docId);
  else if(it.cq>p.qty){it.cq=p.qty;showNotif('الكمية المتاحة محدودة','error');}
  else updateCartUI();
}
function clearCart(){cart=[];updateCartUI();showNotif('تم تفريغ السلة');}
function updateCartUI(){
  document.getElementById('cart-count').textContent = cart.reduce(function(s,i){return s+i.cq},0);
  var total = cart.reduce(function(s,i){return s+i.price*i.cq},0);
  document.getElementById('cart-total').textContent = total.toLocaleString()+' ر.ي';
  var ci = document.getElementById('cart-items');
  if(!cart.length){
    ci.innerHTML='<div class="empty-cart"><div class="empty-icon"><i class="fa fa-shopping-bag"></i></div><div class="empty-txt">السلة فارغة</div></div>';
    return;
  }
  ci.innerHTML = cart.map(function(it){
    return '<div class="cart-item">'
      +'<div class="cart-item-img">'+(it.img?'<img src="'+it.img+'" alt="">':'<i class="fa fa-leaf" style="color:var(--rose)"></i>')+'</div>'
      +'<div class="cart-item-info"><div class="cart-item-brand">'+it.brand+'</div>'
      +'<div class="cart-item-name">'+it.name+'</div>'
      +'<div class="cart-item-foot"><div class="cart-item-price">'+(it.price*it.cq).toLocaleString()+' ر.ي</div>'
      +'<div class="qty-controls"><button class="qty-btn" onclick="changeQty(\''+it._id+'\',-1)">−</button>'
      +'<span class="qty-num">'+it.cq+'</span>'
      +'<button class="qty-btn" onclick="changeQty(\''+it._id+'\',1)">+</button>'
      +'<button class="rm-btn" onclick="removeFromCart(\''+it._id+'\')"><i class="fa fa-trash"></i></button>'
      +'</div></div></div></div>';
  }).join('');
}
function toggleCart(){
  document.getElementById('cart-sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function checkout(){
  if(!cart.length){showNotif('السلة فارغة','error');return;}
  var lines = cart.map(function(i){return '• '+i.brand+' — '+i.name+' × '+i.cq+' = '+(i.price*i.cq).toLocaleString()+' ر.ي'});
  var total  = cart.reduce(function(s,i){return s+i.price*i.cq},0);
  var msg    = 'طلب جديد — '+SETTINGS.storeName+'\n\n'+lines.join('\n')+'\n\nالإجمالي: '+total.toLocaleString()+' ر.ي';
  window.open('https://wa.me/'+SETTINGS.whatsapp+'?text='+encodeURIComponent(msg),'_blank');
}

// ── ADMIN ─────────────────────────────────────────────────
function renderAdmin(){
  var total = products.reduce(function(s,p){return s+p.price*p.qty},0);
  document.getElementById('admin-stats').innerHTML =
    stat(products.length,'إجمالي المنتجات')+
    stat(products.filter(function(p){return p.qty>0}).length,'متاح للبيع')+
    stat(total.toLocaleString(),'قيمة المخزون ر.ي')+
    stat(categories.length,'الفئات');
  var q = (document.getElementById('admin-search')?document.getElementById('admin-search').value:'').toLowerCase();
  var list = q ? products.filter(function(p){return p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||(p.nameAr&&p.nameAr.includes(q))}) : products;
  document.getElementById('admin-tbody').innerHTML = list.map(function(p){
    var qc = p.qty===0?'color:var(--red);font-weight:600':p.qty<3?'color:orange;font-weight:600':'';
    var thumb = p.img
      ? '<img src="'+p.img+'" class="admin-thumb" alt="">'
      : '<div class="admin-thumb-placeholder"><i class="fa fa-leaf"></i></div>';
    return '<tr><td style="color:var(--mid);font-size:10px">'+p.id+'</td>'
      +'<td>'+thumb+'</td>'
      +'<td style="font-size:10px;letter-spacing:1.5px;color:var(--rose);text-transform:uppercase">'+p.brand+'</td>'
      +'<td><div style="font-size:12px;font-weight:500">'+p.name+'</div><div style="font-size:10px;color:var(--mid);margin-top:2px">'+p.nameAr+'</div></td>'
      +'<td><span class="cat-badge '+getCatBadgeClass(p.cat)+'" style="position:static;display:inline-block">'+getCatLabel(p.cat)+'</span></td>'
      +'<td style="'+qc+'">'+p.qty+'</td>'
      +'<td style="font-family:Cormorant Garamond,serif;font-size:16px">'+p.price.toLocaleString()+' ر.ي</td>'
      +'<td><div class="action-btns">'
      +'<button class="btn-edit" onclick="openModal(\''+p._id+'\')"><i class="fa fa-edit"></i></button>'
      +'<button class="btn-delete" onclick="deleteProduct(\''+p._id+'\')"><i class="fa fa-trash"></i></button>'
      +'</div></td></tr>';
  }).join('');
}
function stat(n,l){return '<div class="admin-stat"><div class="admin-stat-num">'+n+'</div><div class="admin-stat-label">'+l+'</div></div>';}

// ── IMAGE UPLOAD (Firebase Storage) ───────────────────────
function uploadImage(input){
  var file = input.files[0]; if(!file) return;
  var area   = document.getElementById('img-upload-area');
  var ph     = document.getElementById('upload-placeholder');
  var prog   = document.getElementById('upload-progress');
  var fill   = document.getElementById('progress-fill');
  var status = document.getElementById('upload-status');
  var prev   = document.getElementById('img-preview-modal');
  ph.style.display   = 'none';
  prog.style.display = 'block';
  prev.style.display = 'none';
  // رفع على Firebase Storage
  var ref  = storage.ref('products/'+Date.now()+'_'+file.name);
  var task = ref.put(file);
  task.on('state_changed',
    function(snap){
      var pct = Math.round(snap.bytesTransferred/snap.totalBytes*100);
      fill.style.width   = pct+'%';
      status.textContent = 'جارٍ الرفع... '+pct+'%';
    },
    function(err){
      showNotif('خطأ في رفع الصورة','error');
      prog.style.display = 'none'; ph.style.display = 'block';
    },
    function(){
      task.snapshot.ref.getDownloadURL().then(function(url){
        currentImgUrl      = url;
        prev.src           = url;
        prev.style.display = 'block';
        prog.style.display = 'none';
        status.textContent = '✓ تم رفع الصورة بنجاح';
        showNotif('✓ تم رفع الصورة على Firebase');
      });
    }
  );
}

// ── CRUD ──────────────────────────────────────────────────
function openModal(docId){
  editId = docId||null; currentImgUrl = '';
  document.getElementById('modal-title').textContent = docId ? 'تعديل المنتج' : 'إضافة منتج جديد';
  buildCatSelect();
  if(docId){
    var p = products.find(function(x){return x._id===docId});
    document.getElementById('f-brand').value   = p.brand;
    document.getElementById('f-name').value    = p.name;
    document.getElementById('f-name-ar').value = p.nameAr;
    document.getElementById('f-price').value   = p.price;
    document.getElementById('f-qty').value     = p.qty;
    document.getElementById('f-cat').value     = p.cat;
    document.getElementById('f-barcode').value = p.barcode||'';
    document.getElementById('f-desc').value    = p.desc||'';
    currentImgUrl = p.img||'';
    var prev = document.getElementById('img-preview-modal');
    if(p.img){prev.src=p.img;prev.style.display='block';}else prev.style.display='none';
    document.getElementById('upload-placeholder').style.display = p.img?'none':'block';
    document.getElementById('upload-progress').style.display    = 'none';
  } else {
    ['f-brand','f-name','f-name-ar','f-price','f-qty','f-barcode','f-desc'].forEach(function(x){document.getElementById(x).value='';});
    document.getElementById('img-preview-modal').style.display  = 'none';
    document.getElementById('upload-placeholder').style.display = 'block';
    document.getElementById('upload-progress').style.display    = 'none';
  }
  document.getElementById('product-modal').classList.add('open');
}
function closeModal(){document.getElementById('product-modal').classList.remove('open');}
function saveProduct(){
  var brand   = document.getElementById('f-brand').value.trim();
  var name    = document.getElementById('f-name').value.trim();
  var nameAr  = document.getElementById('f-name-ar').value.trim();
  var price   = parseFloat(document.getElementById('f-price').value);
  var qty     = parseInt(document.getElementById('f-qty').value);
  var cat     = document.getElementById('f-cat').value;
  var barcode = document.getElementById('f-barcode').value.trim();
  var desc    = document.getElementById('f-desc').value.trim();
  if(!brand||!name||!nameAr||isNaN(price)||isNaN(qty)){showNotif('يرجى ملء الحقول المطلوبة','error');return;}
  var data = {brand,name,nameAr,price,qty,cat,barcode,desc,
    img: currentImgUrl,
    id:  editId ? products.find(function(x){return x._id===editId}).id : Date.now(),
    updatedAt: new Date().toISOString()
  };
  var promise = editId
    ? db.collection('products').doc(editId).update(data)
    : db.collection('products').add(data);
  promise.then(function(){
    showNotif(editId?'✓ تم التحديث على جميع الأجهزة':'✓ تمت الإضافة على جميع الأجهزة');
    closeModal();
  }).catch(function(e){showNotif('خطأ في الحفظ','error');console.error(e);});
}
function deleteProduct(docId){
  if(!confirm('هل أنت متأكدة من حذف هذا المنتج؟')) return;
  db.collection('products').doc(docId).delete().then(function(){
    cart = cart.filter(function(c){return c._id!==docId});
    updateCartUI(); showNotif('تم حذف المنتج');
  }).catch(function(){showNotif('خطأ في الحذف','error');});
}

// ── EXPORT ────────────────────────────────────────────────
function exportForFacebook(){
  var rows=[['id','title','description','availability','condition','price','link','image_link','brand','google_product_category','custom_label_0']];
  products.forEach(function(p){
    rows.push(['LURA-'+p.id, p.brand+' '+p.name, p.desc||(p.nameAr+' — '+p.brand),
      p.qty>0?'in stock':'out of stock','new', p.price.toFixed(2)+' YER',
      SETTINGS.storeUrl+'#p-'+p.id, p.img||'', p.brand, '11734', getCatLabel(p.cat)]);
  });
  downloadCSV(rows,'lura-facebook-'+today()+'.csv');
  showNotif('✓ تم تصدير ملف متجر فيسبوك');
}
function exportForTiktok(){
  var rows=[['Product Name','SKU ID','Description','Price','Currency','Stock Quantity','Category','Brand','Image URL','Condition','Product Status','Arabic Name']];
  products.forEach(function(p){
    rows.push([p.brand+' - '+p.name, p.barcode||('LURA-'+p.id), p.desc||p.nameAr,
      p.price.toFixed(2),'YER', p.qty, getCatLabel(p.cat)+'(Beauty)', p.brand,
      p.img||'','New', p.qty>0?'Active':'Inactive', p.nameAr]);
  });
  downloadCSV(rows,'lura-tiktok-'+today()+'.csv');
  showNotif('✓ تم تصدير ملف متجر تيك توك');
}
function downloadCSV(rows,filename){
  var csv = rows.map(function(row){
    return row.map(function(cell){
      var s=String(cell==null?'':cell).replace(/"/g,'""');
      return (s.includes(',')||s.includes('"')||s.includes('\n'))?'"'+s+'"':s;
    }).join(',');
  }).join('\n');
  var blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function today(){
  var d=new Date();
  return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');
}

// ── NOTIF ─────────────────────────────────────────────────
function showNotif(msg,type){
  var n=document.getElementById('notif');
  n.textContent=msg; n.className='notif '+(type||'success'); n.classList.add('show');
  clearTimeout(n._t); n._t=setTimeout(function(){n.classList.remove('show')},3500);
}

// ── START ─────────────────────────────────────────────────
window.addEventListener('load', initFirebase);
