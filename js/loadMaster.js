let MASTER = {};

document.addEventListener("DOMContentLoaded", () => {
  loadExcel();
});

function loadExcel() {
  fetch("../data/master.xlsx")
    .then(res => res.arrayBuffer())
    .then(buf => {
      let wb = XLSX.read(buf, {type:"array"});

      // Distributor = sheet name
      let distributorList = wb.SheetNames;
      let distSelect = document.getElementById("distributor");
      distributorList.forEach(d => {
        let opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        distSelect.appendChild(opt);
      });

      parseSheet(wb.Sheets[distributorList[0]], distributorList[0]);
    });
}

function changeDistributor(sheetName){
  fetch("../data/master.xlsx")
    .then(res => res.arrayBuffer())
    .then(buf => {
      let wb = XLSX.read(buf, {type:"array"});
      parseSheet(wb.Sheets[sheetName], sheetName);
    });
}

function parseSheet(sheet, name){
  let json = XLSX.utils.sheet_to_json(sheet);

  MASTER = {};

  json.forEach(row=>{
    let prod = row["PRODUCT NAME"];
    let sku  = row["PACK"];
    let rate = Number(row["PRE GST"]);
    let gst  = Number(String(row["GST"]).replace("%",""));
    
    let parsed = parsePack(row["PACK"]);

    if (!MASTER[prod]) MASTER[prod] = {};

    MASTER[prod][sku] = {
      rate: rate,
      gst: gst,
      packSize: parsed.size,
      unit: parsed.unit
    };
  });

  ROWS = [];
  render();
}

function parsePack(pack){
  if (!pack) return { size:1, unit:"Unit" };

  let p = pack.toUpperCase().trim();

  if (p.includes("ML")) return { size: parseFloat(p)/1000, unit:"Litre" };

  if (p.includes("LTR") || p.includes("LITRE") || (p.endsWith("L") && !p.includes("ML")))
    return { size: parseFloat(p), unit:"Litre" };

  if (p.includes("KG")) return { size: parseFloat(p), unit:"Kg" };

  if (p.includes("GM")) return { size: parseFloat(p)/1000, unit:"Kg" };

  return { size:1, unit:"Unit" };
}
