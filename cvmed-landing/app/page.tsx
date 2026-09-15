import Nav from "@/components/Nav";
import ProductMockup from "@/components/ProductMockup";

const CLOCKS = [
  { j: "EU MDR 87", w: "Serious public health threat", n: "2", u: "days" },
  { j: "EU MDR 87", w: "Death or unanticipated serious deterioration", n: "10", u: "days" },
  { j: "EU MDR 87", w: "Other serious incident", n: "15", u: "days" },
  { j: "21 CFR 803", w: "Death, serious injury or malfunction", n: "30", u: "cal. days" },
  { j: "21 CFR 803", w: "Event needing remedial action", n: "5", u: "work days" },
];

const STAGES = [
  ["Intake", "Any channel. Verbatim text locked on save."],
  ["Triage", "Complaint, enquiry or feedback — with rationale."],
  ["Reportability", "Decision tree per market. Named decider, second review."],
  ["Investigation", "Root cause, spec check, risk file feedback."],
  ["Report", "MIR, eMDR or FSCA generated from the record."],
  ["CAPA", "Triggered, tracked, or pushed to your QMS."],
  ["Closure", "Nothing closes with an open clock."],
];

const VALIDATION = [
  ["Validation pack included", "Intended use statement, computerised system risk assessment, IQ/OQ/PQ protocols with executed results, requirements traceability matrix."],
  ["Immutable audit trail", "Every create, edit, view and export, with actor, timestamp and reason. No hard deletes, ever."],
  ["Supplier qualification pack", "Quality agreement, completed supplier questionnaire, SLA, backup and recovery, sub-processor list, open-format data export."],
  ["UK and EU hosting", "Complaint records contain health data. Your data stays in the region you choose, under a DPA you can read."],
];

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <section className="hero" id="top">
          <div className="wrap">
            <h1 className="serif">
              For device companies without a quality department <em>of twelve</em>
            </h1>
            <p>
              cvmed logs every complaint, runs the vigilance clock for each market you sell in, and turns your records
              into the MIR your notified body will actually accept.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#pricing">Book a demo</a>
              <span className="or">or</span>
              <a className="btn btn-ghost" href="#product">See a sample complaint file</a>
            </div>
            <p className="hero-note">MIR 7.3.1 output · EU MDR Art. 87 and 21 CFR 803 clocks · full audit trail</p>
            <ProductMockup />
          </div>
        </section>

        <section id="product">
          <div className="wrap">
            <h2 className="sec serif">
              Built around the three things an auditor <em>checks first</em>
            </h2>
            <p className="lead">
              Most complaint tools are ticketing systems with a regulatory coat of paint. cvmed is modelled on the
              questions a notified body or FDA inspector actually asks.
            </p>
            <div className="grid3">
              <div className="card">
                <span className="k">awareness_at</span>
                <h3>Awareness is evidence, not a date field</h3>
                <p>Every clock runs from the moment you became aware. cvmed records who, when and from what source — with the evidence attached — so the timestamp survives an inspection.</p>
              </div>
              <div className="card">
                <span className="k">reportability × jurisdiction</span>
                <h3>One decision per market, every time</h3>
                <p>A complaint on a device sold in the EU and US gets two assessments, two clocks and two rationales. &ldquo;Not reportable&rdquo; is a signed record, never an empty field.</p>
              </div>
              <div className="card">
                <span className="k">MIR 7.3.1 · XML</span>
                <h3>The report writes itself from the record</h3>
                <p>Serious incidents generate a MIR in the current form version, PDF and XSD-conformant XML, ready for the EUDAMED vigilance module when it goes live.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="band" id="clocks">
          <div className="wrap">
            <div className="clock-grid">
              <div>
                <h2 className="sec serif">The clock is the product</h2>
                <p className="lead">
                  Deadlines are computed from awareness, per jurisdiction, in the right unit — calendar days or working
                  days. Owners get escalating alerts at 50, 75 and 90 percent of the window. A breached deadline is never
                  hidden and never auto-closed.
                </p>
                <a className="btn btn-primary" href="#pricing">Book a demo</a>
              </div>
              <div>
                <div className="rules">
                  {CLOCKS.map((c) => (
                    <div className="rule" key={c.j + c.w}>
                      <div className="j">{c.j}</div>
                      <div className="w">{c.w}</div>
                      <div className="n serif">
                        {c.n}
                        <small>{c.u}</small>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="foot">UK MHRA timescales configured per your current MORE guidance.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pipeline">
          <div className="wrap">
            <h2 className="sec serif">Every complaint follows the same seven stages</h2>
            <p className="lead">
              Because the process is fixed, gaps are visible. An empty CAPA on a closed complaint is a question on
              screen — not something an inspector finds for you.
            </p>
            <div className="stages">
              {STAGES.map(([title, body], i) => (
                <div className="stage" key={title}>
                  <div className="n serif">{i + 1}</div>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="validation">
          <div className="wrap">
            <div className="split">
              <div>
                <h2 className="sec serif">
                  Validate it in days, <em>not weeks</em>
                </h2>
                <p className="lead">
                  Your quality system has to validate every piece of software it depends on. cvmed is built as a
                  fixed-workflow product and ships with the documents your validation needs.
                </p>
                <a className="btn btn-primary" href="#pricing">Request the validation pack</a>
              </div>
              <ul className="list">
                {VALIDATION.map(([title, body]) => (
                  <li key={title}>
                    <div className="tick" aria-hidden="true">✓</div>
                    <div>
                      <b>{title}</b>
                      <span>{body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="wrap">
            <h2 className="sec serif">Pricing is published. There&rsquo;s no discovery call.</h2>
            <p className="lead">
              One price per device family per year. Every module, every user, the validation pack and the supplier
              qualification pack included.
            </p>
            <div className="price">
              <div>
                <div className="amt serif">
                  £349<small>per device family / month, billed annually</small>
                </div>
                <ul>
                  <li>Unlimited users and complaints</li>
                  <li>All jurisdictions, all clocks, MIR generation</li>
                  <li>Validation and supplier qualification packs</li>
                  <li>Pilot pricing available for pre-market companies</li>
                </ul>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <a className="btn btn-primary" href="/demo">Book a demo</a>
                <a className="btn btn-ghost" href="/pilot">Start a 30-day pilot</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div>© {new Date().getFullYear()} cvmed. Built by people who have owned a complaint process.</div>
          <div>
            <a href="/security">Security</a>
            <a href="/privacy">Privacy</a>
            <a href="/validation">Validation</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
