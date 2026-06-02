import { jsPDF } from "jspdf";

interface AnyObj { [k: string]: any }

interface BuildArgs {
  inputs: {
    product: string; activeIngredient: string; dosage: string;
    crop: string; growthStage: string; applicationMethod: string;
    waterSources: { type: string; distanceMeters: number }[];
    existingTreatments: { product: string; activeIngredient: string; daysAgo: number }[];
  };
  result: AnyObj;
}

export function downloadSafetyPdf({ inputs, result }: BuildArgs) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensure = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const line = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number; indent?: number } = {}) => {
    const size = opts.size ?? 10;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? [30, 30, 30]));
    const indent = opts.indent ?? 0;
    const wrapped = doc.splitTextToSize(text, pageW - margin * 2 - indent);
    for (const w of wrapped) {
      ensure(size + 4);
      doc.text(w, margin + indent, y);
      y += size + 2;
    }
    y += opts.gap ?? 2;
  };

  const heading = (text: string, color: [number, number, number] = [34, 87, 56]) => {
    ensure(24);
    y += 6;
    doc.setDrawColor(...color);
    doc.setLineWidth(2);
    doc.line(margin, y, margin + 4, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...color);
    doc.text(text, margin + 10, y + 4);
    y += 14;
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  };

  const kv = (k: string, v: string) => {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(k + ":", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    const wrapped = doc.splitTextToSize(v || "—", pageW - margin * 2 - 120);
    doc.text(wrapped, margin + 120, y);
    y += 12 * wrapped.length + 2;
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(34, 87, 56);
  doc.text("Safety & Tank-Mix Plan", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()} · AgroSense AI`, margin, y);
  y += 16;

  // Verdict banner
  ensure(46);
  const risk = (result.overallRisk || "moderate") as string;
  const riskColor: Record<string, [number, number, number]> = {
    low: [220, 245, 225], moderate: [255, 243, 205], high: [253, 224, 224], critical: [220, 53, 69],
  };
  doc.setFillColor(...(riskColor[risk] ?? [240, 240, 240]));
  doc.roundedRect(margin, y, pageW - margin * 2, 40, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(risk === "critical" ? 255 : 30, risk === "critical" ? 255 : 30, risk === "critical" ? 255 : 30);
  doc.text(`Risk: ${risk.toUpperCase()}  ·  ${result.safeToProceed ? "SAFE TO PROCEED" : "DO NOT PROCEED"}`, margin + 12, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const sumLines = doc.splitTextToSize(result.summary || "", pageW - margin * 2 - 24);
  doc.text(sumLines, margin + 12, y + 30);
  y += 52;

  // Treatment details
  heading("Planned Treatment");
  kv("Product", inputs.product);
  kv("Active ingredient", inputs.activeIngredient);
  kv("Dosage", inputs.dosage);
  kv("Crop / Stage", `${inputs.crop || "—"} (${inputs.growthStage || "—"})`);
  kv("Application method", inputs.applicationMethod);
  if (result.dosageCheck) {
    kv("Dosage check", `${result.dosageCheck.status} · Recommended: ${result.dosageCheck.recommendedDosage || "—"}`);
    if (result.dosageCheck.notes) line(result.dosageCheck.notes, { size: 9, color: [100, 100, 100], indent: 0 });
  }

  // Recent treatments
  if (inputs.existingTreatments?.length) {
    heading("Recent Treatments (last 30 days)");
    for (const t of inputs.existingTreatments) {
      line(`• ${t.product} (${t.activeIngredient || "?"}) — ${t.daysAgo} day(s) ago`, { size: 10 });
    }
  }

  // Tank-mix
  const tm = result.tankMix;
  if (tm) {
    heading("Tank-Mix Analysis", [180, 90, 40]);
    line(`Verdict: ${String(tm.overallVerdict || "").replace("_", " ").toUpperCase()}`, { bold: true });
    if (tm.summary) line(tm.summary);

    if (tm.incompatibilities?.length) {
      y += 4;
      line("Incompatibilities detected:", { bold: true });
      for (const inc of tm.incompatibilities) {
        line(`× vs ${inc.withProduct} (${inc.activeIngredient || "?"}) — ${inc.daysAgo}d ago · ${inc.severity}/${inc.type}`, { bold: true, color: [180, 30, 30] });
        line(`Why: ${inc.reason}`, { indent: 14 });
        line(`Do this: ${inc.mitigation}`, { indent: 14 });
        if (inc.minWaitDays) line(`Wait at least ${inc.minWaitDays} days.`, { indent: 14, color: [180, 90, 40] });
        y += 4;
      }
    }

    if (tm.doNotMixWith?.length) {
      line("Never mix with: " + tm.doNotMixWith.join(", "), { bold: true, color: [180, 30, 30] });
    }

    const plan = tm.safeMixingPlan;
    if (plan && tm.overallVerdict !== "do_not_mix") {
      heading("Safe Mixing Plan", [34, 87, 56]);
      kv("Water pH", plan.waterPh || "—");
      kv("Tank volume", plan.waterVolumePerTank || "—");
      if (plan.canMixTogether?.length) kv("Mix together", plan.canMixTogether.join(", "));

      if (plan.fillOrderSteps?.length) {
        y += 4;
        line("Fill order (follow exactly):", { bold: true });
        for (const s of plan.fillOrderSteps) {
          line(`${s.step}. ${s.action}${s.product ? " — " + s.product : ""}`, { bold: true });
          if (s.notes) line(s.notes, { indent: 14, color: [100, 100, 100] });
        }
      }

      if (plan.jarTest?.required) {
        y += 4;
        line("Jar test (required before spraying):", { bold: true, color: [180, 90, 40] });
        line(plan.jarTest.instructions || "");
      }

      if (plan.adjuvants?.length) {
        y += 4;
        line("Adjuvants:", { bold: true });
        for (const a of plan.adjuvants) line(`• ${a.name} — ${a.purpose} (${a.rate})`);
      }

      if (plan.sprayWithin) line(`Spray within: ${plan.sprayWithin}`, { color: [100, 100, 100] });
    }
  }

  // PPE & buffers
  if (result.ppe?.length || result.buffers) {
    heading("PPE & Buffer Zones");
    if (result.ppe?.length) line("PPE required: " + result.ppe.join(", "));
    if (result.buffers) {
      line(`Buffer zones — Water: ${result.buffers.waterMeters}m · Beehives: ${result.buffers.beehiveMeters}m · Dwellings: ${result.buffers.dwellingMeters}m`);
    }
    if (typeof result.preHarvestIntervalDays === "number") line(`Pre-harvest interval: ${result.preHarvestIntervalDays} days`);
    if (typeof result.reEntryIntervalHours === "number") line(`Re-entry interval: ${result.reEntryIntervalHours} hours`);
  }

  // Water sources & warnings
  if (inputs.waterSources?.length || result.waterSourceWarnings?.length) {
    heading("Water Sources");
    for (const w of inputs.waterSources || []) line(`• ${w.type} at ${w.distanceMeters}m`);
    for (const w of result.waterSourceWarnings || []) {
      line(`⚠ ${w.source} (${w.distanceMeters}m, need ≥ ${w.requiredBufferMeters}m)`, { bold: true, color: [180, 30, 30] });
      if (w.message) line(w.message, { indent: 14 });
    }
  }

  // Restrictions
  if (result.restrictions?.length) {
    heading("Restrictions");
    for (const r of result.restrictions) {
      line(`• [${r.type}] ${r.title}`, { bold: true });
      if (r.detail) line(r.detail, { indent: 14, color: [100, 100, 100] });
    }
  }

  // Action checklist
  if (result.actionChecklist?.length) {
    heading("Action Checklist");
    result.actionChecklist.forEach((s: string, i: number) => line(`☐ ${i + 1}. ${s}`));
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `AgroSense AI · Safety Plan · Page ${i} of ${pages} · For farm records only — always follow local regulations.`,
      pageW / 2,
      pageH - 18,
      { align: "center" }
    );
  }

  const safe = (inputs.product || "treatment").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  doc.save(`safety-plan-${safe}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
