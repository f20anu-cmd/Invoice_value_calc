let MASTER = {};
let workbook = null;

async function loadMasterData() {
  // Excel at data/prices.xlsx
  const resp = await fetch("data/prices.xlsx");
  const buf  = await resp.arrayBuffer();
  workbook   = XLSX.read(buf);

  const distSel = document.getElementById("distributor");
  distSel.innerHTML = workbook.SheetNames
    .map(name => `<option value="${name}">${name}</option>`)
    .join("");

  changeDistributor(workbook.SheetNames[0]); // load first distributor
}

function changeDistributor(sheetName){
  const sheet = workbook.Sheets[sheetName];
  const rows  = XLSX.utils.sheet_to_json(sheet, { header:1 });

  MASTER = buildMaster(rows);
  ROWS = [];               // reset current rows when distributor changes
  render();                // re-render UI
}

// rows is [ [S NO, PRODUCT NAME, PACK, QTY, MRP, PRE GST, GST, POST GST], ... ]
function buildMaster(rows){
  const headerIndex = rows.findIndex(
    r => Array.isArray(r) && r.some(c => String(c).toUpperCase().includes("PRODUCT NAME"))
  );
  const data = rows.slice(headerIndex + 1);

  const M = {};

  data.forEach(r => {
    const product = r[1];
    const pack    = r[2];
    const pre     = r[5];
    const gstRaw  = r[6];

    if (!product || !pack || pre == null || gstRaw == null) return;

    const parsedPack = parsePack(String(pack));
    let gst;

    if (typeof gstRaw === "string" && gstRaw.includes("%")) {
      gst = parseFloat(gstRaw.replace("%",""));
    } else {
      const g = Number(gstRaw);
      gst = g < 1 ? g*100 : g;
    }

    const prodKey = String(product).trim();
    const skuKey  = String(pack).trim();   // we show PACK as SKU

    if (!M[prodKey]) M[prodKey] = {};

    M[prodKey][skuKey] = {
      rate: Number(pre),
      gst:  gst,
      packSize: parsedPack.size,  // litres or kg per unit
      unit: parsedPack.unit       // "Litre" or "Kg"
    };
  });

  return M;
}

// intelligent PACK parser → always returns { size, unit } with unit in ["Litre", "Kg", "Unit"]
function parsePack(pack) {
  if (!pack) return { size:1, unit:"Unit" };

  let p = pack.toUpperCase().trim();

  // ML → litres
  if (p.includes("ML")) {
    const ml = parseFloat(p);
    return { size: ml / 1000, unit:"Litre" };
  }

  // LTR / LITRE / "1 L" etc → litres
  if (p.includes("LTR") || p.includes("LITRE") || (p.endsWith("L") && !p.includes("ML"))) {
    const l = parseFloat(p);
    return { size: l, unit:"Litre" };
  }

  // KG → kg
  if (p.includes("KG")) {
    const kg = parseFloat(p);
    return { size: kg, unit:"Kg" };
  }

  // GM → kg (grams)
  if (p.includes("GM") || p.includes("GMS") || p.includes("GRAM")) {
    const gm = parseFloat(p);
    return { size: gm / 1000, unit:"Kg" };
  }

  // Fallback
  return { size:1, unit:"Unit" };
}

// kick everything off
loadMasterData();
