let MASTER = {};
let workbook = null;

async function loadMasterData() {
  const resp = await fetch("data/prices.xlsx");
  const buf = await resp.arrayBuffer();
  workbook = XLSX.read(buf);

  let distSel = document.getElementById("distributor");
  distSel.innerHTML = workbook.SheetNames
    .map(s => `<option value="${s}">${s}</option>`).join("");

  changeDistributor(workbook.SheetNames[0]);

  const now = new Date();
  document.getElementById("timestamp").value =
    now.toLocaleDateString() + " " + now.toLocaleTimeString();
}

function changeDistributor(sheetName){
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {header:1});

  MASTER = buildMaster(rows);
  render();
}

function buildMaster(rows){
  let HEADER = rows.findIndex(r => r.includes("PRODUCT NAME"));
  let data = rows.slice(HEADER+1);

  let M = {};

  data.forEach(r=>{
    let product = r[1];
    let pack = r[2];
    let pre = r[5];
    let gst = parseFloat(r[6]); // "18%" or 0.18

    if (!product || !pack) return;

    product = product.trim();

    let packInfo = parsePack(pack);
    let sku = `${product} ${pack}`;

    if (!M[product]) M[product] = {};

    M[product][sku] = {
      rate: Number(pre),
      gst: gst < 1 ? gst*100 : gst,
      packSize: packInfo.size  // litres or kg
    };
  });
  return M;
}

function parsePack(pack){
  pack = pack.trim().toUpperCase();

  if (pack.includes("ML")) {
    let ml = parseFloat(pack);
    return { size: ml/1000, unit:"Litre" };
  }
  if (pack.includes("L")) {
    return { size: parseFloat(pack), unit:"Litre" };
  }
  if (pack.includes("KG")) {
    return { size: parseFloat(pack), unit:"Kg" };
  }
  return { size:1, unit:"Unit" };
}

loadMasterData();
