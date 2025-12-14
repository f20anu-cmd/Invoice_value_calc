async function loadMasterData() {
  const response = await fetch("data/prices.xlsx");
  const buf = await response.arrayBuffer();
  const workbook = XLSX.read(buf);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {header:1});

  // Find header row
  const headerIndex = rows.findIndex(r => r.includes("PRODUCAT NAME"));

  MASTER = {};

  rows.slice(headerIndex + 1).forEach(r => {
    const product = r[1];
    const pack = r[2];
    const pre_gst = parseFloat(r[5]);
    const gst_percent = parseFloat(r[6]) * 100;

    if (!product || !pack) return;

    let unit = "Unit";
    let p = pack.toUpperCase();
    if (p.includes("ML")) unit = "Ml";
    else if (p.includes("L")) unit = "Litre";
    else if (p.includes("KG")) unit = "Kg";

    const sku = `${product} ${pack}`;

    if (!MASTER[product]) MASTER[product] = {};

    MASTER[product][sku] = {
      unit: unit,
      rate: pre_gst,
      gst: gst_percent
    };
  });

  console.log("MASTER Loaded:", MASTER);

  render();  // Build table with new data
}

loadMasterData();
