let MASTER = {};
let workbook = null;

async function loadMasterData() {
  const resp = await fetch("data/prices.xlsx");
  const buf = await resp.arrayBuffer();
  workbook = XLSX.read(buf);

  let sel = document.getElementById("distributor");
  sel.innerHTML = workbook.SheetNames.map(s => `<option value="${s}">${s}</option>`).join("");

  changeDistributor(workbook.SheetNames[0]);
}

function changeDistributor(sheetName){
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
  MASTER = buildMaster(rows);
  render();
}

function buildMaster(rows){
  let headerIndex = rows.findIndex(r => r.includes("PRODUCT NAME"));
  let data = rows.slice(headerIndex + 1);

  let M = {};

  data.forEach(r => {
    let product = r[1];
    let pack = r[2];
    let preGST = r[5];
    let gstRaw = r[6];

    if (!product || !pack) return;

    const gst =
      typeof gstRaw === "string" && gstRaw.includes("%")
        ? parseFloat(gstRaw.replace("%",""))
        : gstRaw < 1
          ? gstRaw * 100
          : gstRaw;

    const packInfo = parsePack(pack);
    const sku = `${product} ${pack}`;

    if (!M[product]) M[product] = {};

    M[product][sku] = {
      rate: Number(preGST),
      gst: gst,
      packSize: packInfo.size,
      unit: packInfo.unit
    };
  });

  return M;
}

function parsePack(pack){
  pack = pack.toUpperCase();

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
