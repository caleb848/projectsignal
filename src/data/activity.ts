import type { Activity } from "@/lib/types";

/** Recent project activity, newest last (sorted at read time). */
export const activity: Activity[] = [
  // Summit
  { id: "a1", projectId: "summit-brand-campaign", at: "2026-09-30T16:10", type: "approval-requested", text: "Final creative package sent for client approval", actor: "Maya Chen" },
  { id: "a2", projectId: "summit-brand-campaign", at: "2026-10-02T17:30", type: "timeline", text: "Final creative approval passed its due date; reminder sent", actor: "Maya Chen" },
  { id: "a3", projectId: "summit-brand-campaign", at: "2026-10-05T10:05", type: "risk-escalated", text: "Approval delay escalated to Fernway CMO via account lead", actor: "Maya Chen" },
  { id: "a4", projectId: "summit-brand-campaign", at: "2026-10-06T14:40", type: "feedback", text: "Client requested product-first alternate :15 cut", actor: "Fernway · Marketing Director" },
  { id: "a5", projectId: "summit-brand-campaign", at: "2026-10-07T09:15", type: "timeline", text: "QA plan re-worked around a 4-day window; contingency now fully used", actor: "Maya Chen" },
  // Nova
  { id: "a6", projectId: "nova-video-production", at: "2026-10-01T11:20", type: "risk-escalated", text: "Music licence clearance flagged; two library alternates shortlisted", actor: "Sofia Alvarez" },
  { id: "a7", projectId: "nova-video-production", at: "2026-10-06T18:05", type: "delivery", text: "Offline edit v3 not received by end of day from Lumen Post", actor: "Sofia Alvarez" },
  { id: "a8", projectId: "nova-video-production", at: "2026-10-07T08:50", type: "budget", text: "Forecast updated to $50.2K to reflect post overtime", actor: "Sofia Alvarez" },
  { id: "a9", projectId: "nova-video-production", at: "2026-10-07T11:30", type: "approval-requested", text: "Freelance editor request sent to Studio Director", actor: "Sofia Alvarez" },
  // Atlas
  { id: "a10", projectId: "atlas-website-relaunch", at: "2026-10-01T15:00", type: "approval-requested", text: "Product and campaign copy submitted to compliance", actor: "Leo Martins" },
  { id: "a11", projectId: "atlas-website-relaunch", at: "2026-10-02T12:10", type: "risk-resolved", text: "Design system signed off by all stakeholder groups", actor: "Leo Martins" },
  { id: "a12", projectId: "atlas-website-relaunch", at: "2026-10-02T16:45", type: "delivery", text: "Front-end development complete for all templates", actor: "Tech lead" },
  { id: "a13", projectId: "atlas-website-relaunch", at: "2026-10-06T10:30", type: "risk-escalated", text: "Compliance review escalated to client sponsor", actor: "Leo Martins" },
  { id: "a14", projectId: "atlas-website-relaunch", at: "2026-10-06T16:20", type: "budget", text: "Forecast revised to $92.6K after calculator sprint estimate", actor: "Leo Martins" },
  // Cedar
  { id: "a15", projectId: "cedar-landing-page-program", at: "2026-09-29T09:40", type: "approval-received", text: "Page designs approved with no revisions", actor: "Brightmere · Digital team" },
  { id: "a16", projectId: "cedar-landing-page-program", at: "2026-10-02T09:00", type: "timeline", text: "Page development start held — staging access not provisioned", actor: "Sofia Alvarez" },
  { id: "a17", projectId: "cedar-landing-page-program", at: "2026-10-05T13:15", type: "risk-escalated", text: "Staging access escalated to client sponsor", actor: "Sofia Alvarez" },
  { id: "a18", projectId: "cedar-landing-page-program", at: "2026-10-07T10:00", type: "decision", text: "Agency-hosted staging proposed as fallback", actor: "Sofia Alvarez" },
  // Beacon
  { id: "a19", projectId: "beacon-brand-refresh", at: "2026-09-30T14:00", type: "scope", text: "Client requested three sub-brand lockups", actor: "Halvard · VP Marketing" },
  { id: "a20", projectId: "beacon-brand-refresh", at: "2026-10-01T11:00", type: "approval-requested", text: "Change order CO-02 issued with two options", actor: "Maya Chen" },
  { id: "a21", projectId: "beacon-brand-refresh", at: "2026-10-05T15:30", type: "feedback", text: "Route B presented to brand committee", actor: "Maya Chen" },
  { id: "a22", projectId: "beacon-brand-refresh", at: "2026-10-07T09:45", type: "budget", text: "Forecast revised to $48.4K pending CO-02", actor: "Maya Chen" },
  // Northstar
  { id: "a23", projectId: "northstar-product-launch", at: "2026-09-30T10:20", type: "risk-resolved", text: "Photographer confirmed for Oct 13–16", actor: "Daniel Okafor" },
  { id: "a24", projectId: "northstar-product-launch", at: "2026-10-05T14:10", type: "delivery", text: "Casting and set design signed off", actor: "Quillon · Product marketing" },
  { id: "a25", projectId: "northstar-product-launch", at: "2026-10-06T16:00", type: "timeline", text: "Sample courier booked for Oct 9", actor: "Daniel Okafor" },
  // Evergreen
  { id: "a26", projectId: "evergreen-social-campaign", at: "2026-10-02T17:00", type: "approval-received", text: "All 42 posts approved", actor: "Wrenfield · Social lead" },
  { id: "a27", projectId: "evergreen-social-campaign", at: "2026-10-05T11:40", type: "risk-resolved", text: "Both creator contracts signed", actor: "Priya Raman" },
  { id: "a28", projectId: "evergreen-social-campaign", at: "2026-10-07T13:20", type: "timeline", text: "Week-one posts scheduled; launch readiness check booked for Oct 8", actor: "Priya Raman" },
  // Horizon
  { id: "a29", projectId: "horizon-paid-media-launch", at: "2026-10-05T10:50", type: "approval-requested", text: "Media purchase order submitted to client finance", actor: "Daniel Okafor" },
  { id: "a30", projectId: "horizon-paid-media-launch", at: "2026-10-05T16:30", type: "risk-escalated", text: "Dependency on Cedar landing pages added to risk register", actor: "Daniel Okafor" },
  // Orbit
  { id: "a31", projectId: "orbit-content-series", at: "2026-10-01T12:00", type: "risk-resolved", text: "Host availability resolved by re-sequencing episodes", actor: "Priya Raman" },
  { id: "a32", projectId: "orbit-content-series", at: "2026-10-06T15:10", type: "approval-requested", text: "Episode 1–3 scripts sent for approval", actor: "Priya Raman" },
  // Peak
  { id: "a33", projectId: "peak-event-campaign", at: "2026-10-06T10:00", type: "approval-received", text: "Campaign concept approved without changes", actor: "Alder Ridge · Marketing" },
  // Mosaic
  { id: "a34", projectId: "mosaic-crm-campaign", at: "2026-09-29T16:30", type: "risk-resolved", text: "Privacy team approved consent journey", actor: "Daniel Okafor" },
  { id: "a35", projectId: "mosaic-crm-campaign", at: "2026-10-06T11:15", type: "feedback", text: "Data team confirmed two of three segments on schedule", actor: "Data & Analytics team" },
  // Aurora
  { id: "a36", projectId: "aurora-creative-refresh", at: "2026-10-02T15:20", type: "approval-received", text: "Refresh brief approved", actor: "Tessellate · Performance lead" },
  // Harbor
  { id: "a37", projectId: "harbor-holiday-preview", at: "2026-09-28T09:00", type: "delivery", text: "Campaign launched on schedule across all channels", actor: "Leo Martins" },
  { id: "a38", projectId: "harbor-holiday-preview", at: "2026-10-02T14:00", type: "budget", text: "Final reconciliation: $25.1K of $26K budget", actor: "Leo Martins" },
];
