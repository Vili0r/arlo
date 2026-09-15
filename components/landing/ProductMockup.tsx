const STAGES = [
  { label: "Intake", value: "29 Aug", state: "done" },
  { label: "Triage", value: "Complaint", state: "done" },
  { label: "Reportability", value: "EU pending", state: "now" },
  { label: "Investigation", value: "Complete", state: "done" },
  { label: "Report", value: "—", state: "" },
  { label: "CAPA", value: "—", state: "" },
  { label: "Closure", value: "—", state: "" },
] as const;

export default function ProductMockup() {
  return (
    <div
      className="shot"
      role="img"
      aria-label="cvmed complaints list showing regulatory deadlines per market and a seven-stage complaint pipeline"
    >
      <div className="shot-top">
        <div className="dots">
          <i />
          <i />
          <i />
        </div>
        <div className="search">Search by ID, device, lot or country</div>
      </div>

      <div className="shot-body">
        <aside className="side" aria-hidden="true">
          <div className="ws">Acme Medical · Ventilator V2</div>
          <a href="#product" tabIndex={-1}>Overview</a>
          <a href="#product" tabIndex={-1} className="on">Complaints</a>
          <a href="#product" tabIndex={-1}>Vigilance cases</a>
          <a href="#product" tabIndex={-1}>Trends</a>
          <a href="#product" tabIndex={-1}>CAPA</a>
          <a href="#product" tabIndex={-1}>Devices</a>
          <a href="#product" tabIndex={-1}>Audit trail</a>
        </aside>

        <div className="main">
          <h2 className="serif">
            Morning, <span>Alex</span>
          </h2>
          <p className="sub">
            14 open complaints · 2 reportability decisions due this week · 0 breached
          </p>

          <div className="tbl">
            <div className="trh">
              <div>Record</div>
              <div>Complaint</div>
              <div>Regulatory clock</div>
              <div>Stage</div>
              <div>Owner</div>
            </div>

            <div className="tr">
              <div className="id">CMP-0003</div>
              <div>
                <div className="t">Mechanical fault</div>
                <div className="d">Ventilator V2 · Lot 2261 · Germany</div>
              </div>
              <div>
                <span className="pill p-red">EU · 2 days left</span>
                <div className="d" style={{ marginTop: 4 }}>
                  US · not on market
                </div>
              </div>
              <div>
                <span className="pill p-amber">Reportability</span>
              </div>
              <div className="own">A. Tsouni</div>

              <div className="pipe">
                {STAGES.map((s) => (
                  <div key={s.label} className={s.state}>
                    <b>{s.label}</b>
                    {s.value}
                  </div>
                ))}
              </div>

              <div className="next">
                <div>
                  <b>Next action</b>
                  <span>Record EU reportability decision · aware 29 Aug · deadline 13 Sep</span>
                </div>
                <a className="btn btn-primary" href="#product" tabIndex={-1}>
                  Open decision
                </a>
              </div>
            </div>

            <div className="tr">
              <div className="id">CMP-0002</div>
              <div>
                <div className="t">Will not power on</div>
                <div className="d">CardiacSense · Lot 1187 · United Kingdom</div>
              </div>
              <div>
                <span className="pill p-amber">UK · 6 days left</span>
              </div>
              <div>
                <span className="pill p-mute">Investigation</span>
              </div>
              <div className="own">V. Cuni</div>
            </div>

            <div className="tr">
              <div className="id">CMP-0001</div>
              <div>
                <div className="t">Rate accuracy</div>
                <div className="d">CardiacSense · Lot 1187 · United Kingdom</div>
              </div>
              <div>
                <span className="pill p-green">Not reportable · decided</span>
              </div>
              <div>
                <span className="pill p-mute">Investigation</span>
              </div>
              <div className="own">V. Cuni</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
