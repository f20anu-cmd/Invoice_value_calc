let MASTER = {};
let workbook = null;

async function loadMasterData() {
  const resp = await fetch("data/prices.xlsx");
  const buf  = await resp.arrayBuffer();
  workbook   = XLSX.read(buf);

  const distSel = document.getElementById("distributor");
  distSel.innerHTML = workbook.SheetNames
    .map(name => `<option value="${name}">${name}</option>`)
    .join("");

  changeDistributor(workbook.SheetNames[0]);
}

function changeDistributor(sheetName){
  const sheet = workbook.Sheets[sheetName];
  const rows  = XLSX.utils.sheet_to_json(sheet, { header:1 });

  MASTER = buildMaster(rows);
  ROWS = [];
  render();
}

function buildMaster(rows){
  const headerIndex = rows.findIndex(
    r => Array.isArray(r) && r.some(c => String(c).toUpperCase().includes("PRODUCT"))
  );
  const data = rows.slice(headerIndex + 1);

  const M = {};

  data.forEach(r => {
    const product = r[1];
    const pack    = r[2];
    const qtyPerCase = r[3];  // QTY per case in L/Kg
    const pre     = r[5];      // PRE GST (rate per unit)
    const gstRaw  = r[6];      // GST

    if (!product || !pack || qtyPerCase == null || pre == null || gstRaw == null) return;

    const parsedPack = parsePack(String(pack));

    let gst;
    if (typeof gstRaw === "string" && gstRaw.includes("%")) {
      gst = parseFloat(gstRaw.replace("%",""));
    } else {
      const g = Number(gstRaw);
      gst = g < 1 ? g * 100 : g;
    }

    const prodKey = String(product).trim();
    const skuKey  = String(pack).trim();

    if (!M[prodKey]) M[prodKey] = {};

    M[prodKey][skuKey] = {
      rate: Number(pre),
      gst:  gst,
      packSize: parsedPack.size,
      unit: parsedPack.unit,
      qtyPerCase: Number(qtyPerCase)  // Qty in L/Kg per case
    };
  });

  return M;
}

function parsePack(pack) {
  if (!pack) return { size:1, unit:"Unit" };

  let p = pack.toUpperCase().trim();

  if (p.includes("ML")) {
    return { size: parseFloat(p)/1000, unit:"Litre" };
  }

  if (p.includes("LTR") || p.includes("LITRE") || (p.endsWith("L") && !p.includes("ML"))) {
    return { size: parseFloat(p), unit:"Litre" };
  }

  if (p.includes("KG")) {
    return { size: parseFloat(p), unit:"Kg" };
  }

  if (p.includes("GM") || p.includes("GMS") || p.includes("GRAM")) {
    return { size: parseFloat(p)/1000, unit:"Kg" };
  }

  return { size:1, unit:"Unit" };
}

loadMasterData();
